import { useMemo, useState, type ReactNode } from "react";
import type {
  ClosingLineCheck,
  OddsFormat,
  ProviderHealth,
  SportEvent,
  SportKey,
} from "@bettin2win/types";
import { formatOdds } from "@bettin2win/types";
import { SPORT_TABS } from "./sports";
import { useOddsSocket } from "./useOddsSocket";
import { useBaseballScores, type GameScore } from "./useScores";
import { SportField } from "./SportField";
import { MarketTicker } from "./MarketTicker";
import { ProviderStatusPanel } from "./ProviderStatusPanel";
import { BetTypeGuide } from "./BetTypeGuide";
import { OddsTranslator } from "./OddsTranslator";
import { buildDemoEventsBySport } from "./mockEvents";
import {
  classifyFeedStatus,
  feedLabelFromStatus,
  sportHasOdds,
} from "./providerStatus";

const DEMO_EVENTS_BY_SPORT = buildDemoEventsBySport();

export function App() {
  const { connected, eventsBySport, movements, health } = useOddsSocket();
  const [sport, setSport] = useState<SportKey>("football");
  const [format, setFormat] = useState<OddsFormat>("decimal");
  const [demoMode, setDemoMode] = useState(false);

  const liveEvents = eventsBySport[sport] ?? [];
  const events = demoMode ? (DEMO_EVENTS_BY_SPORT[sport] ?? []) : liveEvents;
  const sportHealth = useMemo(
    () => health.find((h) => h.sport === sport),
    [health, sport],
  );
  const feedStatus = useMemo(
    () => classifyFeedStatus(sportHealth, liveEvents, demoMode),
    [sportHealth, liveEvents, demoMode],
  );
  const sportMovements = useMemo(
    () => (demoMode ? [] : movements.filter((m) => m.sport === sport)),
    [movements, sport, demoMode],
  );
  const scores = useBaseballScores(sport === "baseball" && !demoMode);
  const hasOdds = useMemo(() => sportHasOdds(events), [events]);

  return (
    <div className="app">
      <MarketTicker />
      <p className="legal-strip">
        Informational only. Not financial advice. Not a sportsbook. 21+ where legal.
      </p>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">B2W</span>
          <div>
            <h1>Bettin2Win</h1>
            <p className="brand-tagline">The beginner&apos;s odds guide — not a sportsbook.</p>
            <p className="brand-sub">
              Compare live lines, translate odds into plain English, and learn what each bet
              means before you wager elsewhere.
            </p>
          </div>
        </div>
        <div className="topbar-right">
          <button
            type="button"
            className={`demo-toggle ${demoMode ? "active" : ""}`}
            onClick={() => setDemoMode((value) => !value)}
          >
            {demoMode ? "Exit demo" : "View demo data"}
          </button>
          <FormatToggle value={format} onChange={setFormat} />
          <span className={`status-dot ${connected ? "live" : "down"}`}>
            {connected ? "live" : "reconnecting"}
          </span>
        </div>
      </header>

      {demoMode && (
        <p className="demo-banner">
          Viewing <strong>demo data</strong> — sample games and prices for exploring the UI, not live feeds.
        </p>
      )}

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

      <ProviderStatusPanel
        health={health}
        liveEventsBySport={eventsBySport}
        activeSport={sport}
        demoMode={demoMode}
        onSelectSport={setSport}
      />

      <BeginnerGuide />
      <BetTypeGuide />

      <main className="layout">
        <section className="board">
          <div className="board-head">
            <h2>{SPORT_TABS.find((t) => t.key === sport)?.label}</h2>
            <span className={`mode-badge ${demoMode ? "mock" : sportHealth?.mode ?? "mock"}`}>
              {feedLabelFromStatus(feedStatus)}
              {!demoMode && sportHealth?.message ? ` - ${sportHealth.message}` : ""}
            </span>
          </div>

          {events.length === 0 ? (
            <p className="empty">
              {emptyBoardMessage(sport, sportHealth, demoMode, () => setDemoMode(true))}
            </p>
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
            <p className="empty small">
              {hasOdds
                ? "No moves yet. Prices update every few seconds."
                : "No betting prices in this feed right now."}
            </p>
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

function oddsUnavailableLabel(status: SportEvent["status"]): string {
  if (status === "finished") return "Odds closed — game final";
  if (status === "live") return "No live prices right now";
  return "Odds not posted yet";
}

function emptyBoardMessage(
  sport: SportKey,
  health: ProviderHealth | undefined,
  demoMode: boolean,
  onDemo: () => void,
): ReactNode {
  if (demoMode) {
    return "Demo board is loading…";
  }
  if (!health || health.mode === "mock") {
    return (
      <>
        Waiting for the first snapshot from the engine.{" "}
        <button type="button" className="empty-demo-link" onClick={onDemo}>
          View demo data
        </button>{" "}
        to explore the UI while providers connect.
      </>
    );
  }
  if (sport === "football") {
    return (
      <>
        No NFL games on the board right now. Preseason and regular season boards fill automatically when ESPN lists games.{" "}
        <button type="button" className="empty-demo-link" onClick={onDemo}>
          View demo data
        </button>
      </>
    );
  }
  return (
    <>
      Connected to a live feed, but nothing is scheduled for this sport right now.{" "}
      <button type="button" className="empty-demo-link" onClick={onDemo}>
        View demo data
      </button>
    </>
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
  { term: "Best price", plain: "The most generous odds for you across all the bookmakers we check — same pick, better payout." },
  { term: "Moneyline", plain: "Pick who wins the game outright. No point spread." },
  { term: "Spread", plain: "Bet whether a team wins by enough points, or loses by fewer than the line." },
  { term: "Total (O/U)", plain: "Bet whether both teams' combined score goes over or under a number." },
  { term: "Implied probability", plain: "What the odds suggest about chance before the sportsbook's profit margin." },
  { term: "Decimal (D)", plain: "e.g. 2.50 — bet $1, get $2.50 back total if it wins (European style)." },
  { term: "American (A)", plain: "e.g. +150 / -200 — plus = underdog payout, minus = how much to risk to win $100." },
  { term: "Fractional (F)", plain: "e.g. 3/2 — win $3 for every $2 staked (UK / horse-racing style)." },
  { term: "@ (the at sign)", plain: '"Away team @ Home team" — the second team is hosting.' },
  { term: "● LIVE / FINAL", plain: "Real game status — live score and inning, or the final result." },
  { term: "Upcoming", plain: "The game/race hasn't started yet." },
];

/** A warm, plain-English intro for someone who has never placed a bet. */
function BeginnerGuide() {
  return (
    <details className="guide">
      <summary>🎀 New to betting? Start here — the 2-minute beginner guide</summary>
      <div className="guide-body">
        <div className="guide-card">
          <h4>💡 What this app even is</h4>
          <p>
            Bettin2Win is an <strong>interactive odds coach</strong>, not a casino. We
            don&apos;t take your money or tell you what to bet. We <em>translate</em> the
            lines, compare <strong>best prices</strong> across sportsbooks, show what a
            payout would look like, and flag risk — so you understand the bet before you
            place it elsewhere.
          </p>
        </div>

        <div className="guide-card">
          <h4>🃏 How to read a game</h4>
          <ul>
            <li>
              <strong>"Away @ Home"</strong> = visiting team vs. the team hosting at
              their own stadium. (Look for the <em>visiting</em> / <em>hosting</em> tags.)
            </li>
            <li>
              <strong>The number is the odds.</strong> A <strong>minus</strong> (e.g.
              −150) = the favorite; you risk $150 to win $100. A <strong>plus</strong>{" "}
              (e.g. +130) = the underdog; a $100 bet wins you $130.
            </li>
            <li>
              <strong>"Best"</strong> shows the most generous price and which book has
              it. Same bet, more winnings — that's the whole trick.
            </li>
            <li>
              The <strong>D / A / F</strong> toggle up top switches the odds style.
              <strong> Decimal</strong> is the friendliest: 2.50 means a $1 bet returns
              $2.50 total.
            </li>
          </ul>
        </div>

        <div className="guide-card">
          <h4>📈 "Drifting" vs "Shortening"</h4>
          <p>
            In the Market-movement box: <strong>shortening ↓</strong> = odds got
            smaller, so it's now seen as <strong>more likely</strong> to win.{" "}
            <strong>Drifting ↑</strong> = odds got bigger, seen as <strong>less
            likely</strong>. It's the crowd changing its mind in real time.
          </p>
        </div>

        <div className="guide-card">
          <h4>✅ How to actually place a bet</h4>
          <ol>
            <li>Pick a game here and decide what you like.</li>
            <li>
              Find the <strong>"Best"</strong> price and note the sportsbook (DraftKings,
              FanDuel, BetMGM…).
            </li>
            <li>
              Open <strong>that sportsbook's own app/website</strong> and place the bet
              there.
            </li>
            <li>
              You must be <strong>21+</strong> and in a place where it's legal — the book
              checks your location automatically.
            </li>
          </ol>
        </div>

        <div className="guide-card guide-card--warn">
          <h4>💛 Be smart, be safe</h4>
          <p>
            It's real money and <strong>the math favors the house</strong> — the
            sportsbook's profit is baked into every price, so most people lose over time.
            Bet only what you'd be fine losing, treat it like paying for fun (not making
            money), and stop the second it isn't fun. Free, confidential help in the US:{" "}
            <strong>1-800-GAMBLER</strong>.
          </p>
        </div>
      </div>
    </details>
  );
}

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
    </article>
  );
}

function LineCheckBanner({
  check,
  format,
}: {
  check: ClosingLineCheck;
  format: OddsFormat;
}) {
  const price = formatOdds(check.favoritePrice, format);
  const book = check.favoriteBookmaker ? ` at ${check.favoriteBookmaker}` : "";
  const base = `${check.favorite} ${price}${book}`;
  const text =
    check.status === "tracking"
      ? `Tracking pregame favorite: ${base}`
      : check.status === "pending-result"
        ? `Closing favorite: ${base}. Waiting for final.`
        : check.status === "favorite-won"
          ? `Closing favorite won: ${base}. Final winner: ${check.winner}.`
          : `Closing favorite lost: ${base}. Final winner: ${check.winner}.`;

  return (
    <div className={`line-check ${check.status}`}>
      <span>{text}</span>
    </div>
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
