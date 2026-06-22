import type { MarketTickerSnapshot, StockQuote } from "@bettin2win/types";

const USER_AGENT = "Mozilla/5.0 (compatible; Bettin2Win/1.0)";
const CACHE_TTL_MS = 60_000;
const CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

export const TICKER_SYMBOLS: Array<{ symbol: string; label: string }> = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "QQQ", label: "Nasdaq" },
  { symbol: "DIA", label: "Dow" },
  { symbol: "AAPL", label: "Apple" },
  { symbol: "MSFT", label: "Microsoft" },
  { symbol: "NVDA", label: "NVIDIA" },
  { symbol: "TSLA", label: "Tesla" },
  { symbol: "AMZN", label: "Amazon" },
  { symbol: "META", label: "Meta" },
  { symbol: "GOOGL", label: "Alphabet" },
];

let cache: MarketTickerSnapshot | null = null;
let cacheAt = 0;

export async function getMarketTicker(): Promise<MarketTickerSnapshot> {
  if (cache && Date.now() - cacheAt < CACHE_TTL_MS) return cache;

  const settled = await Promise.allSettled(
    TICKER_SYMBOLS.map(({ symbol, label }) => fetchQuote(symbol, label)),
  );

  const quotes = settled
    .filter((result): result is PromiseFulfilledResult<StockQuote | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((quote): quote is StockQuote => quote !== null);

  const snapshot: MarketTickerSnapshot = {
    quotes,
    source: "yahoo-finance",
    updatedAt: new Date().toISOString(),
    message:
      quotes.length === 0
        ? "market data unavailable"
        : `${quotes.length}/${TICKER_SYMBOLS.length} symbols from Yahoo Finance`,
  };

  if (quotes.length > 0) {
    cache = snapshot;
    cacheAt = Date.now();
  }

  return snapshot;
}

async function fetchQuote(symbol: string, label: string): Promise<StockQuote | null> {
  const res = await fetch(`${CHART_URL}/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return null;

  return normalizeYahooChart(symbol, label, await res.json());
}

export function normalizeYahooChart(symbol: string, label: string, body: unknown): StockQuote | null {
  const chart = object(field(object(body), "chart"));
  const result = object(array(chart, "result")[0]);
  const meta = object(field(result, "meta"));
  const price = number(field(meta, "regularMarketPrice"));
  const previousClose = number(field(meta, "chartPreviousClose") ?? field(meta, "previousClose"));
  if (price === undefined || previousClose === undefined || previousClose === 0) return null;

  const change = Number((price - previousClose).toFixed(2));
  const changePercent = Number(((change / previousClose) * 100).toFixed(2));
  const marketTime = number(field(meta, "regularMarketTime"));

  return {
    symbol,
    label,
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