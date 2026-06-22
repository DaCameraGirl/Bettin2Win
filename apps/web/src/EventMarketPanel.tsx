import type { OddsFormat, SportEvent } from "@bettin2win/types";
import { formatOdds } from "@bettin2win/types";
import { OddsTranslator } from "./OddsTranslator";
import { LineCheckBanner } from "./LineCheckBanner";

function oddsUnavailableLabel(status: SportEvent["status"]): string {
  if (status === "finished") return "Odds closed — game final";
  if (status === "live") return "No live prices right now";
  return "Odds not posted yet";
}

interface EventMarketPanelProps {
  event: SportEvent;
  format: OddsFormat;
  showOpportunityLabel?: boolean;
}

export function EventMarketPanel({ event, format, showOpportunityLabel = false }: EventMarketPanelProps) {
  return (
    <div className="event-market-panel">
      {showOpportunityLabel && event.venue && (
        <p className="event-market-opportunity">{event.venue}</p>
      )}
      <OddsTranslator event={event} format={format} />
      {event.prediction && (
        <div className={`model-pick ${event.prediction.status}`}>
          <span className="mp-star">★</span>
          <div className="mp-main">
            <span className="mp-text">
              Model pick: <strong>{event.prediction.pick}</strong>
              {event.prediction.probability !== undefined && (
                <span className="mp-prob"> {event.prediction.probability}% likely</span>
              )}
              {event.prediction.pick !== event.prediction.label && (
                <span className="mp-label"> · {event.prediction.label}</span>
              )}
            </span>
            {(event.prediction.correctScore || (event.prediction.extras?.length ?? 0) > 0) && (
              <span className="mp-tags">
                {event.prediction.correctScore && (
                  <span className="mp-chip">Score {event.prediction.correctScore}</span>
                )}
                {event.prediction.extras?.map((extra) => (
                  <span key={extra} className="mp-chip">
                    {extra}
                  </span>
                ))}
              </span>
            )}
          </div>
          {event.prediction.odds && (
            <span className="mp-odds">
              {formatOdds(event.prediction.odds, format)}
            </span>
          )}
          {event.prediction.status !== "pending" && (
            <span className={`mp-result ${event.prediction.status}`}>
              {event.prediction.status === "won" ? "✓ won" : "✗ lost"}
            </span>
          )}
        </div>
      )}
      {event.lineCheck && <LineCheckBanner check={event.lineCheck} format={format} />}
      {event.sport !== "golf" && (
        <div className="runners">
          {event.runners.map((runner) => {
            const picked = event.prediction?.pick === runner.name;
            return (
              <div key={runner.id} className={`runner ${picked ? "picked" : ""}`}>
                <div className="runner-top">
                  <span className="runner-name">
                    {picked && <span className="runner-star">★</span>}
                    {runner.number ? `${runner.number}. ` : ""}
                    {runner.name}
                  </span>
                  {runner.bestPrice ? (
                    <span className="runner-best">
                      <span className="runner-best-label">Best</span>
                      <strong>{formatOdds(runner.bestPrice, format)}</strong>
                      {runner.bestBookmaker && <em>{runner.bestBookmaker}</em>}
                    </span>
                  ) : (
                    <span className="runner-price missing">{oddsUnavailableLabel(event.status)}</span>
                  )}
                </div>
                {runner.odds.length > 0 && (
                  <div className="book-list">
                    {runner.odds
                      .slice()
                      .sort((a, b) => b.price - a.price)
                      .map((line) => (
                        <span
                          key={`${line.bookmaker}-${line.runnerId}-${line.price}`}
                          className={line.bookmaker === runner.bestBookmaker ? "book-chip best" : "book-chip"}
                        >
                          <span>{line.bookmaker}</span>
                          <strong>{formatOdds(line.price, format)}</strong>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}