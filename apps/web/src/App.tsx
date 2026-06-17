import { useMemo, useState } from "react";
import type { OddsFormat, SportEvent, SportKey } from "@bettin2win/types";
import { formatOdds } from "@bettin2win/types";
import { SPORT_TABS } from "./sports";
import { useOddsSocket } from "./useOddsSocket";
import { useBaseballScores, type GameScore } from "./useScores";

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
                  <em>{m.direction}</em>
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
  const showScore = score && score.state !== "scheduled";
  return (
    <article className="event">
      <div className="event-head">
        <h4>{event.name}</h4>
        <div className="event-tags">
          {showScore && (
            <span className={`score-badge ${score.state}`}>
              {score.state === "live" ? "● LIVE" : "FINAL"} {score.current}
              {score.detail ? ` · ${score.detail}` : ""}
            </span>
          )}
          <span className={`pill ${event.status}`}>{event.status}</span>
        </div>
      </div>
      <div className="runners">
        {event.runners.map((runner) => (
          <div key={runner.id} className="runner">
            <span className="runner-name">
              {runner.number ? `${runner.number}. ` : ""}
              {runner.name}
            </span>
            <span className="runner-price">
              {runner.bestPrice ? formatOdds(runner.bestPrice, format) : "-"}
            </span>
          </div>
        ))}
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
