import type { MarketTickerSnapshot, StockQuote } from "@bettin2win/types";
import {
  TICKER_WATCHLIST,
  WATCHLIST_CATEGORY_LABELS,
  type TickerEntry,
} from "./market-watchlist.js";

const USER_AGENT = "Mozilla/5.0 (compatible; Bettin2Win/1.0)";
const CACHE_TTL_MS = 90_000;
const FETCH_BATCH_SIZE = 8;
const CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

let cache: MarketTickerSnapshot | null = null;
let cacheAt = 0;

export async function getMarketTicker(): Promise<MarketTickerSnapshot> {
  if (cache && Date.now() - cacheAt < CACHE_TTL_MS) return cache;

  const quotes = await fetchAllQuotes(TICKER_WATCHLIST);
  const snapshot: MarketTickerSnapshot = {
    quotes,
    source: "yahoo-finance",
    updatedAt: new Date().toISOString(),
    categories: WATCHLIST_CATEGORY_LABELS,
    message:
      quotes.length === 0
        ? "market data unavailable"
        : `${quotes.length}/${TICKER_WATCHLIST.length} symbols from Yahoo Finance`,
  };

  if (quotes.length > 0) {
    cache = snapshot;
    cacheAt = Date.now();
  }

  return snapshot;
}

async function fetchAllQuotes(entries: TickerEntry[]): Promise<StockQuote[]> {
  const quotes: StockQuote[] = [];

  for (let index = 0; index < entries.length; index += FETCH_BATCH_SIZE) {
    const batch = entries.slice(index, index + FETCH_BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map((entry) => fetchQuote(entry)));
    for (const result of settled) {
      if (result.status === "fulfilled" && result.value) quotes.push(result.value);
    }
  }

  const order = new Map(entries.map((entry, idx) => [entry.symbol, idx]));
  quotes.sort((a, b) => (order.get(a.symbol) ?? 999) - (order.get(b.symbol) ?? 999));
  return quotes;
}

async function fetchQuote(entry: TickerEntry): Promise<StockQuote | null> {
  const res = await fetch(
    `${CHART_URL}/${encodeURIComponent(entry.symbol)}?interval=1d&range=1d`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  if (!res.ok) return null;

  return normalizeYahooChart(entry, await res.json());
}

export function normalizeYahooChart(entry: TickerEntry, body: unknown): StockQuote | null {
  const chart = object(field(object(body), "chart"));
  const result = object(array(chart, "result")[0]);
  const meta = object(field(result, "meta"));
  const price = number(field(meta, "regularMarketPrice"));
  const previousClose = number(field(meta, "chartPreviousClose") ?? field(meta, "previousClose"));
  if (price === undefined || previousClose === undefined || previousClose === 0) return null;

  const change = Number((price - previousClose).toFixed(2));
  const changePercent = Number(((change / previousClose) * 100).toFixed(2));
  const marketTime = number(field(meta, "regularMarketTime"));
  const shortName = str(field(meta, "shortName") ?? field(meta, "longName")).trim();

  return {
    symbol: entry.symbol,
    label: shortName || entry.label,
    category: entry.category,
    price,
    change,
    changePercent,
    currency: str(field(meta, "currency")).trim() || "USD",
    marketState: str(field(meta, "marketState")).trim() || undefined,
    updatedAt: marketTime
      ? new Date(marketTime * 1000).toISOString()
      : new Date().toISOString(),
  };
}

function array(obj: Record<string, unknown>, key: string): unknown[] {
  const value = field(obj, key);
  return Array.isArray(value) ? value : [];
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function field(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

function number(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}