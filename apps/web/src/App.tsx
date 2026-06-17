import { useMemo, useState } from "react";
import type { OddsFormat, SportEvent, SportKey } from "@bettin2win/types";
import { formatOdds } from "@bettin2win/types";
import { SPORT_TABS } from "./sports";
import { useOddsSocket } from "./useOddsSocket";

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
              <EventCard key={event.id} event={event} format={format} />
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
    </div>
  );
}

function EventCard({ event, format }: { event: SportEvent; format: OddsFormat }) {
  return (
    <article className="event">
      <div className="event-head">
        <h4>{event.name}</h4>
        <span className={`pill ${event.status}`}>{event.status}</span>
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
