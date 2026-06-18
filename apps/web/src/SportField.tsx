import type { SportEvent, SportKey } from "@bettin2win/types";
import type { GameScore } from "./useScores";

/** Sports that are a genuine two-team contest (away @ home + a score). */
const TEAM_SPORTS: SportKey[] = ["football", "baseball", "basketball", "hockey", "soccer"];

/** Split "Away @ Home" into the two sides. Returns null for non-matchup names. */
function parseMatchup(name: string): { away: string; home: string } | null {
  const [away, home] = name.split(" @ ");
  if (!away || !home) return null;
  return { away: away.trim(), home: home.trim() };
}

/** Split a "1 - 9" score string into away/home halves. */
function parseScore(current?: string): { away: string; home: string } | null {
  if (!current) return null;
  const [away, home] = current.split("-").map((p) => p.trim());
  if (!away || !home) return null;
  return { away, home };
}

/** Friendly start time, e.g. "Today 7:48 PM" or "Jun 17, 7:48 PM". */
function formatStart(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return `Today ${time}`;
  const day = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${day}, ${time}`;
}

/**
 * The themed "field" that sits at the top of every event card. Team sports
 * (baseball, football) render a two-sided scoreboard-on-a-field; racing sports
 * render a shared track strip (no home/away, no two-team score).
 */
export function SportField({
  event,
  score,
}: {
  event: SportEvent;
  score?: GameScore;
}) {
  if (TEAM_SPORTS.includes(event.sport)) {
    return <TeamField event={event} score={score} />;
  }
  return <TrackField event={event} />;
}

function TeamField({ event, score }: { event: SportEvent; score?: GameScore }) {
  const matchup = parseMatchup(event.name);
  const away = score?.away ?? matchup?.away ?? "Away";
  const home = score?.home ?? matchup?.home ?? "Home";

  // Derive the score + status line from whichever source the sport has:
  // baseball uses the live-score hook; soccer uses its own result/status.
  let tally: { away: string; home: string } | null = null;
  let stateClass = "scheduled";
  let statusLine: string;
  const kickLabel =
    event.sport === "baseball"
      ? "First pitch"
      : event.sport === "basketball"
        ? "Tipoff"
        : event.sport === "hockey"
          ? "Puck drop"
          : "Kickoff";

  if (score && score.state !== "scheduled") {
    stateClass = score.state;
    tally = parseScore(score.current);
    statusLine = `${score.state === "live" ? "● LIVE" : "FINAL"}${
      score.detail ? ` · ${score.detail}` : ""
    }`;
  } else if (event.score && event.status !== "upcoming") {
    stateClass = event.status === "live" ? "live" : "finished";
    tally = parseScore(event.score);
    statusLine =
      event.status === "live"
        ? `● LIVE${event.clock ? ` · ${event.clock}` : ""}`
        : event.clock || "FINAL";
  } else if (event.sport === "soccer" && event.status !== "upcoming") {
    stateClass = event.status === "live" ? "live" : "finished";
    tally = parseScore(event.prediction?.result);
    statusLine =
      event.status === "live"
        ? `● LIVE${event.clock ? ` · ${event.clock}` : ""}`
        : "FULL TIME";
  } else {
    statusLine = `${kickLabel} ${formatStart(event.startTime)}`;
  }

  const turf =
    event.sport === "baseball" ? (
      <Diamond />
    ) : event.sport === "basketball" ? (
      <Court />
    ) : event.sport === "hockey" ? (
      <Rink />
    ) : event.sport === "soccer" ? (
      <Pitch />
    ) : (
      <Gridiron />
    );

  return (
    <div className={`field field--${event.sport}`}>
      <div className="field-turf" aria-hidden>
        {turf}
      </div>

      <div className="field-side field-side--away">
        <span
          className="field-role"
          title="Away = the visiting team. They travel to play at the home team's stadium."
        >
          AWAY<span className="field-host">visiting</span>
        </span>
        <TeamName name={away} logo={event.awayLogo} />
        <FormGuide value={event.form?.away} />
        {tally && <span className="field-score">{tally.away}</span>}
      </div>

      <div className="field-center">
        <span className={`field-status ${stateClass}`}>{statusLine}</span>
        {event.venue && <span className="field-comp">{event.venue}</span>}
      </div>

      <div className="field-side field-side--home">
        <span
          className="field-role"
          title="Home = the team hosting the game at their own stadium."
        >
          HOME<span className="field-host">hosting</span>
        </span>
        <TeamName name={home} logo={event.homeLogo} align="right" />
        <FormGuide value={event.form?.home} align="right" />
        {tally && <span className="field-score">{tally.home}</span>}
      </div>
    </div>
  );
}

function TeamName({
  name,
  logo,
  align = "left",
}: {
  name: string;
  logo?: string;
  align?: "left" | "right";
}) {
  return (
    <span className={`field-team-wrap ${align === "right" ? "right" : ""}`}>
      {logo && <img className="field-logo" src={logo} alt="" loading="lazy" />}
      <span className="field-team">{name}</span>
    </span>
  );
}

function FormGuide({
  value,
  align = "left",
}: {
  value?: string;
  align?: "left" | "right";
}) {
  if (!value) return null;
  return (
    <span className={`form-guide ${align === "right" ? "right" : ""}`} aria-label={`Form ${value}`}>
      {value.split("").map((letter, index) => (
        <span key={`${letter}-${index}`} className={`form-letter ${formClass(letter)}`}>
          {letter}
        </span>
      ))}
    </span>
  );
}

function formClass(letter: string): string {
  if (letter === "W") return "win";
  if (letter === "L") return "loss";
  return "draw";
}

/** Emoji that races down each track sport's lanes. */
const RACE_EMOJI: Partial<Record<SportKey, string>> = {
  nascar: "🏎️",
  "horse-racing": "🏇",
  greyhound: "🐕",
};

/**
 * Real (non-scratched) runners in best-guess running order: favourite first
 * (lowest decimal price), falling back to program number when a feed carries
 * no prices (e.g. the horse-racing free tier). True live in-race positions
 * aren't in the current feeds, so this is a proxy that upgrades automatically
 * the day a positions feed is wired.
 */
function runningOrder(runners: SportEvent["runners"]): SportEvent["runners"] {
  return runners
    .filter((r) => r.name && !/non[- ]?runner/i.test(r.name))
    .slice()
    .sort((a, b) => {
      const pa = a.bestPrice ?? Number.POSITIVE_INFINITY;
      const pb = b.bestPrice ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return (a.number ?? 999) - (b.number ?? 999);
    });
}

function TrackField({ event }: { event: SportEvent }) {
  const isOval = event.sport === "nascar";
  const order = runningOrder(event.runners);
  const runnerCount = order.length;
  const ranked = order.some((r) => r.bestPrice != null);
  return (
    <div className={`field field--track field--${event.sport}`}>
      <div className="field-turf" aria-hidden>
        {isOval ? <Oval /> : <Lanes />}
      </div>
      <div className="track-head">
        <div className="track-meta">
          <span className="track-venue">{event.venue ?? event.name}</span>
          <span className="track-info">
            {runnerCount} runner{runnerCount === 1 ? "" : "s"}
            {" · "}
            {formatStart(event.startTime)}
          </span>
        </div>
        <span className={`field-status ${event.status}`}>
          {event.status === "live"
            ? "● LIVE"
            : event.status === "finished"
              ? "FINISHED"
              : "Off soon"}
        </span>
      </div>
      <RaceLanes
        sport={event.sport}
        runners={order}
        live={event.status === "live"}
        ranked={ranked}
      />
    </div>
  );
}

function RaceLanes({
  sport,
  runners,
  live,
  ranked,
}: {
  sport: SportKey;
  runners: SportEvent["runners"];
  live: boolean;
  ranked: boolean;
}) {
  const emoji = RACE_EMOJI[sport] ?? "•";
  const MAX = 6;
  const shown = runners.slice(0, MAX);
  if (shown.length === 0) return null;
  return (
    <div className={`race-lanes ${live ? "live" : ""}`} aria-hidden>
      {shown.map((runner, i) => (
        <div className="race-lane" key={runner.id}>
          <span className="race-pos">{i + 1}</span>
          <span
            className="race-runner"
            style={{
              animationDuration: `${(live ? 2.6 : 4.2) + i * 0.35}s`,
              animationDelay: `${i * -0.5}s`,
            }}
          >
            <span className="race-emoji">{emoji}</span>
            <span className="race-num">{runner.number ?? i + 1}</span>
          </span>
        </div>
      ))}
      <span className="race-caption">
        {ranked
          ? `running order — favourite (${emoji} 1) leads`
          : `${shown.length} on track${runners.length > MAX ? ` of ${runners.length}` : ""} · by number`}
      </span>
    </div>
  );
}

/* ---- pure-CSS sport graphics (decorative) ---- */

function Diamond() {
  return (
    <div className="diamond">
      <span className="base base--home" />
      <span className="base base--first" />
      <span className="base base--second" />
      <span className="base base--third" />
      <span className="mound" />
    </div>
  );
}

function Gridiron() {
  return (
    <div className="gridiron">
      <span className="ball-marker football-ball">🏈</span>
      <span className="endzone endzone--left" />
      <span className="endzone endzone--right" />
    </div>
  );
}

function Court() {
  return (
    <div className="court">
      <span className="court-line" />
      <span className="court-circle" />
      <span className="court-arc court-arc--left" />
      <span className="court-arc court-arc--right" />
      <span className="ball-marker basketball-ball">🏀</span>
    </div>
  );
}

function Rink() {
  return (
    <div className="rink">
      <span className="rink-line rink-line--center" />
      <span className="rink-line rink-line--left" />
      <span className="rink-line rink-line--right" />
      <span className="rink-circle rink-circle--left" />
      <span className="rink-circle rink-circle--right" />
      <span className="puck-marker" />
    </div>
  );
}

function Pitch() {
  return (
    <div className="pitch">
      <span className="pitch-line" />
      <span className="pitch-circle" />
      <span className="pitch-box pitch-box--left" />
      <span className="pitch-box pitch-box--right" />
      <span className="ball-marker soccer-ball">⚽</span>
    </div>
  );
}

function Oval() {
  return <div className="oval" />;
}

function Lanes() {
  return <div className="lanes" />;
}

