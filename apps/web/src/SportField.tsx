import type { SportEvent, SportKey } from "@bettin2win/types";
import type { GameScore } from "./useScores";

/** Sports that are a genuine two-team contest (away @ home + a score). */
const TEAM_SPORTS: SportKey[] = ["football", "baseball"];

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
  const live = score && score.state !== "scheduled";
  const tally = live ? parseScore(score?.current) : null;

  const kickLabel = event.sport === "baseball" ? "First pitch" : "Kickoff";
  const statusLine = live
    ? `${score?.state === "live" ? "● LIVE" : "FINAL"}${
        score?.detail ? ` · ${score.detail}` : ""
      }`
    : `${kickLabel} ${formatStart(event.startTime)}`;

  return (
    <div className={`field field--${event.sport}`}>
      <div className="field-turf" aria-hidden>
        {event.sport === "baseball" ? <Diamond /> : <Gridiron />}
      </div>

      <div className="field-side field-side--away">
        <span className="field-role">AWAY</span>
        <span className="field-team">{away}</span>
        {tally && <span className="field-score">{tally.away}</span>}
      </div>

      <div className="field-center">
        <span className={`field-status ${live ? score?.state : "scheduled"}`}>
          {statusLine}
        </span>
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

function Oval() {
  return <div className="oval" />;
}

function Lanes() {
  return <div className="lanes" />;
}
