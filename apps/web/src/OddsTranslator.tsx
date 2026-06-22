import { useMemo } from "react";
import type { OddsFormat, SportEvent } from "@bettin2win/types";
import { explainEvent } from "./oddsExplain";

interface OddsTranslatorProps {
  event: SportEvent;
  format: OddsFormat;
}

export function OddsTranslator({ event, format }: OddsTranslatorProps) {
  const explanation = useMemo(() => explainEvent(event, format), [event, format]);

  if (!explanation) {
    return (
      <div className="odds-translator odds-translator--muted">
        <p>
          <strong>No prices on this card yet.</strong> This is a real game feed without odds.
          Switch to a sport with live prices, or use <strong>View demo data</strong> to practice
          reading lines.
        </p>
      </div>
    );
  }

  return (
    <details className="odds-translator odds-translator--cta">
      <summary className="explain-bet-cta">
        <span className="explain-bet-cta-icon" aria-hidden>
          ✦
        </span>
        <span className="explain-bet-cta-text">
          <strong>Explain this bet like I&apos;m brand new</strong>
          <em>Payouts, implied chance, and what has to happen to win</em>
        </span>
        <span className="explain-bet-cta-action" aria-hidden />
      </summary>
      <div className="odds-translator-body">
        <div className="odds-translator-intro">
          <span className="market-chip">{explanation.marketType}</span>
          {explanation.favoredSummary && <p>{explanation.favoredSummary}</p>}
        </div>

        {explanation.riskBadges.length > 0 && (
          <div className="risk-badges">
            {explanation.riskBadges.map((badge) => (
              <div key={badge.label} className={`risk-badge risk-badge--${badge.label}`}>
                <strong>{badge.title}</strong>
                <span>{badge.message}</span>
              </div>
            ))}
          </div>
        )}

        <div className="runner-explain-grid">
          {explanation.runners.map((runner) => (
            <article key={runner.name} className={`runner-explain runner-explain--${runner.role}`}>
              <header>
                <h5>{runner.name}</h5>
                <span className="runner-explain-odds">{runner.oddsText}</span>
              </header>
              <p className="runner-explain-plain">{runner.plainEnglish}</p>
              <p className="runner-explain-implied">
                Implied chance (before sportsbook margin): <strong>{runner.impliedPercent}%</strong>
              </p>
              <table className="payout-table">
                <thead>
                  <tr>
                    <th>If you bet</th>
                    <th>Profit if it wins</th>
                    <th>Total back</th>
                  </tr>
                </thead>
                <tbody>
                  {runner.payouts.map((row) => (
                    <tr key={row.stake}>
                      <td>${row.stake}</td>
                      <td>${row.profit.toFixed(2)}</td>
                      <td>${row.totalReturn.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {runner.bestPriceNote && <p className="best-price-note">{runner.bestPriceNote}</p>}
            </article>
          ))}
        </div>

        <div className="odds-translator-foot">
          <p>
            <strong>What has to happen:</strong> {explanation.winCondition}
          </p>
          {explanation.houseMarginNote && (
            <p className="odds-translator-margin">{explanation.houseMarginNote}</p>
          )}
          <p className="odds-translator-note">
            Lower payout usually means the books see that outcome as more likely. Higher payout
            usually means less likely, but more reward if correct. {explanation.disclaimer}
          </p>
        </div>
      </div>
    </details>
  );
}