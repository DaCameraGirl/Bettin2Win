import type { SportEvent, SportKey } from "@bettin2win/types";
import type { GameScore } from "./useScores";

/** Sports that are a genuine two-team contest (away @ home + a score). */
const TEAM_SPORTS: SportKey[] = ["football", "baseball", "soccer"];

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
  const kickLabel = event.sport === "baseball" ? "First pitch" : "Kickoff";

  if (score && score.state !== "scheduled") {
    stateClass = score.state;
    tally = parseScore(score.current);
    statusLine = `${score.state === "live" ? "● LIVE" : "FINAL"}${
      score.detail ? ` · ${score.detail}` : ""
    }`;
  } else if (event.sport === "soccer" && event.status !== "upcoming") {
    stateClass = event.status === "live" ? "live" : "finished";
    tally = parseScore(event.prediction?.result);
    statusLine = event.status === "live" ? "● LIVE" : "FULL TIME";
  } else {
    statusLine = `${kickLabel} ${formatStart(event.startTime)}`;
  }

  const turf =
    event.sport === "baseball" ? (
      <Diamond />
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
        <span className="field-role">AWAY</span>
        <span className="field-team">{away}</span>
        {tally && <span className="field-score">{tally.away}</span>}
      </div>

      <div className="field-center">
        <span className={`field-status ${stateClass}`}>{statusLine}</span>
        {event.venue && <span className="field-comp">{event.venue}</span>}
      </div>

      <div className="field-side field-side--home">
        <span className="field-role">
          HOME<span className="field-host">hosting</span>
        </span>
        <span className="field-team">{home}</span>
        {tally && <span className="field-score">{tally.home}</span>}
      </div>
    </div>
  );
}

function TrackField({ event }: { event: SportEvent }) {
  const runnerCount = event.runners.length;
  const isOval = event.sport === "nascar";
  return (
    <div className={`field field--track field--${event.sport}`}>
      <div className="field-turf" aria-hidden>
        {isOval ? <Oval /> : <Lanes />}
      </div>
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
      <span className="endzone endzone--left" />
      <span className="endzone endzone--right" />
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
    </div>
  );
}

function Oval() {
  return <div className="oval" />;
}

function Lanes() {
  return <div className="lanes" />;
}
