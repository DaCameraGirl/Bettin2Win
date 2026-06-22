import type { StockQuote } from "@bettin2win/types";
import { useMarketTicker } from "./useMarketTicker";

export function MarketTicker() {
  const { quotes, loading, message, updatedAt } = useMarketTicker();

  if (!loading && quotes.length === 0) return null;

  const track = [...quotes, ...quotes];

  return (
    <div className="market-ticker" aria-label="Live market quotes">
      <div className="market-ticker-label">Markets</div>
      <div className="market-ticker-viewport">
        <div className={`market-ticker-track ${quotes.length < 4 ? "static" : ""}`}>
          {track.map((quote, index) => (
            <TickerChip key={`${quote.symbol}-${index}`} quote={quote} />
          ))}
        </div>
      </div>
      <div className="market-ticker-meta">
        {loading ? "Loading…" : formatUpdatedAt(updatedAt)}
        {message ? ` · ${message}` : ""}
      </div>
    </div>
  );
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