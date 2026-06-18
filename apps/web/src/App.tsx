import { useMemo, useState } from "react";
import type { OddsFormat, SportEvent, SportKey } from "@bettin2win/types";
import { formatOdds } from "@bettin2win/types";
import { SPORT_TABS } from "./sports";
import { useOddsSocket } from "./useOddsSocket";
import { useBaseballScores, type GameScore } from "./useScores";
import { SportField } from "./SportField";

export function App() {
  const { connected, eventsBySport, movements, health } = useOddsSocket();
  const [sport, setSport] = useState<SportKey>("football");
  const [format, setFormat] = useState<OddsFormat>("decimal");

  const events = eventsBySport[sport] ?? [];
  const sportHealth = useMemo(
    () => health.find((h) => h.sport === sport),
    [health, sport],
  );
  const sportMovements = useMemo(
    () => movements.filter((m) => m.sport === sport),
    [movements, sport],
  );
  const scores = useBaseballScores(sport === "baseball");

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">B2W</span>
          <div>
            <h1>Bettin2Win</h1>
            <p>real-time multi-sport odds</p>
          </div>
        </div>
        <div className="topbar-right">
          <FormatToggle value={format} onChange={setFormat} />
          <span className={`status-dot ${connected ? "live" : "down"}`}>
            {connected ? "live" : "reconnecting"}
          </span>
        </div>
      </header>

      <nav className="tabs">
        {SPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${tab.key === sport ? "active" : ""}`}
            onClick={() => setSport(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="layout">
        <section className="board">
          <div className="board-head">
            <h2>{SPORT_TABS.find((t) => t.key === sport)?.label}</h2>
            {sportHealth && (
              <span className={`mode-badge ${sportHealth.mode}`}>
                {sportHealth.mode === "live" ? "LIVE FEED" : "DEMO DATA"}
                {sportHealth.message ? ` - ${sportHealth.message}` : ""}
              </span>
            )}
          </div>

          {events.length === 0 ? (
            <p className="empty">Waiting for the first snapshot...</p>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                format={format}
                score={scores.get(event.name)}
              />
            ))
          )}
        </section>

        <aside className="feed">
          <h3>Market movement</h3>
          <p className="feed-legend">
            <span className="shortening">↓ shortening = more likely</span>
            <span className="drifting">↑ drifting = less likely</span>
          </p>
          {sportMovements.length === 0 ? (
            <p className="empty small">No moves yet. Prices update every few seconds.</p>
          ) : (
            <ul>
              {sportMovements.map((m, i) => (
                <li key={`${m.runnerId}-${i}`} className={m.direction}>
                  <strong>{m.runnerName}</strong>
                  <span>
                    {m.from.toFixed(2)} → {m.to.toFixed(2)}
                  </span>
                  <em className={m.direction}>{movementHint(m.direction)}</em>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>

      <Glossary />
    </div>
  );
}

/** Plain-English meaning shown next to each market move. */
function movementHint(direction: "shortening" | "drifting"): string {
  return direction === "shortening"
    ? "shortening ↓ — odds got smaller, now MORE likely to win"
    : "drifting ↑ — odds got bigger, now LESS likely to win";
}

const GLOSSARY: { term: string; plain: string }[] = [
  { term: "Odds", plain: "How likely something is + what it pays. Lower number = more likely to happen." },
  { term: "Shortening ↓", plain: "The odds got SMALLER. The market now thinks it's MORE likely to win." },
  { term: "Drifting ↑", plain: "The odds got BIGGER. The market thinks it's LESS likely to win." },
  { term: "Best price", plain: "The most generous odds for you across all the bookmakers we check." },
  { term: "Decimal (D)", plain: "e.g. 2.50 — bet $1, get $2.50 back total if it wins (European style)." },
  { term: "American (A)", plain: "e.g. +150 / -200 — plus = underdog payout, minus = how much to risk to win $100." },
  { term: "Fractional (F)", plain: "e.g. 3/2 — win $3 for every $2 staked (UK / horse-racing style)." },
  { term: "@ (the at sign)", plain: '"Away team @ Home team" — the second team is hosting.' },
  { term: "● LIVE / FINAL", plain: "Real game status — live score and inning, or the final result." },
  { term: "Upcoming", plain: "The game/race hasn't started yet." },
];

function Glossary() {
  return (
    <details className="glossary">
      <summary>📖 What do these words mean? (plain-English glossary)</summary>
      <table>
        <tbody>
          {GLOSSARY.map((g) => (
            <tr key={g.term}>
              <th>{g.term}</th>
              <td>{g.plain}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

function EventCard({
  event,
  format,
  score,
}: {
  event: SportEvent;
  format: OddsFormat;
  score?: GameScore;
}) {
  return (
    <article className="event">
      <div className="event-head">
        <h4>{event.name}</h4>
        <span className={`pill ${event.status}`}>{event.status}</span>
      </div>
      <SportField event={event} score={score} />
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
                  <span className="runner-price missing">Odds unavailable</span>
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
    </article>
  );
}

function FormatToggle({
  value,
  onChange,
}: {
  value: OddsFormat;
  onChange: (f: OddsFormat) => void;
}) {
  const formats: OddsFormat[] = ["decimal", "american", "fractional"];
  return (
    <div className="format-toggle">
      {formats.map((f) => (
        <button
          key={f}
          className={f === value ? "active" : ""}
          onClick={() => onChange(f)}
        >
          {f[0]?.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
