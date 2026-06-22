import type { StockQuote } from "@bettin2win/types";
import { useMarketTicker } from "./useMarketTicker";

const CATEGORY_LABELS: Record<string, string> = {
  indexes: "Indexes",
  megaCapTech: "Mega-cap tech",
  chipAi: "Chips & software",
  retailFavorites: "Retail favorites",
  finance: "Finance",
  consumer: "Consumer",
  healthcare: "Healthcare",
  energy: "Energy",
  leveragedEtfs: "Leveraged ETFs",
  commodities: "Commodities",
};

export function MarketTicker() {
  const { quotes, loading, message, updatedAt, categories } = useMarketTicker();

  if (!loading && quotes.length === 0) return null;

  const segments = buildSegments(quotes, categories ?? CATEGORY_LABELS);
  const track = [...segments, ...segments];
  const scrollSeconds = Math.max(360, segments.length * 12);

  return (
    <div className="market-ticker" aria-label="Live market quotes">
      <div className="market-ticker-label">Markets</div>
      <div className="market-ticker-viewport" title="Hover to pause the ticker">
        <div
          className={`market-ticker-track ${segments.length < 6 ? "static" : ""}`}
          style={{ animationDuration: `${scrollSeconds}s` }}
        >
          {track.map((segment, index) =>
            segment.type === "category" ? (
              <span key={`cat-${segment.key}-${index}`} className="ticker-category">
                {segment.label}
              </span>
            ) : (
              <TickerChip key={`${segment.quote.symbol}-${index}`} quote={segment.quote} />
            ),
          )}
        </div>
      </div>
      <div className="market-ticker-meta">
        {loading ? "Loading…" : formatUpdatedAt(updatedAt)}
        {message ? ` · ${message}` : ""}
      </div>
    </div>
  );
}

type TickerSegment =
  | { type: "category"; key: string; label: string }
  | { type: "quote"; quote: StockQuote };

function buildSegments(
  quotes: StockQuote[],
  categoryLabels: Record<string, string>,
): TickerSegment[] {
  const segments: TickerSegment[] = [];
  let currentCategory = "";

  for (const quote of quotes) {
    const category = quote.category ?? "other";
    if (category !== currentCategory) {
      currentCategory = category;
      segments.push({
        type: "category",
        key: category,
        label: categoryLabels[category] ?? category,
      });
    }
    segments.push({ type: "quote", quote });
  }

  return segments;
}

function TickerChip({ quote }: { quote: StockQuote }) {
  const direction = quote.change >= 0 ? "up" : "down";
  const sign = quote.change >= 0 ? "+" : "";

  return (
    <div className={`ticker-chip ${direction}`}>
      <span className="ticker-symbol">{quote.symbol}</span>
      <span className="ticker-label">{quote.label}</span>
      <span className="ticker-price">${quote.price.toFixed(2)}</span>
      <span className="ticker-change">
        {sign}
        {quote.change.toFixed(2)} ({sign}
        {quote.changePercent.toFixed(2)}%)
      </span>
    </div>
  );
}

function formatUpdatedAt(value: string): string {
  if (!value) return "Live";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Live";
  return `Updated ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}