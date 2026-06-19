import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;

const SCORE_NOW_URL = "https://api-web.nhle.com/v1/score/now";

/**
 * Official NHL public scoreboard fallback.
 *
 * This feed does not expose US sportsbook prices, but it gives real NHL games,
 * live/final status, score, venue, teams, and logos without any API key.
 */
export class NhlScoreboardAdapter implements SportAdapter {
  readonly sport = "hockey";
  readonly provider = "nhl-scoreboard";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    try {
      const res = await fetch(SCORE_NOW_URL);
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }

      const events = normalizeNhlScoreboard(await res.json());
      if (events.length === 0) {
        return { mode: "live", events, message: "0 NHL games in public scoreboard window" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} real NHL scoreboard game${events.length === 1 ? "" : "s"} (odds unavailable)`,
      };
    } catch (err) {
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: err instanceof Error ? err.message : "fetch failed",
      };
    }
  }
}

export function normalizeNhlScoreboard(body: unknown): SportEvent[] {
  return array(field(object(body), "games"))
    .map(normalizeNhlGame)
    .filter((event): event is SportEvent => event !== null);
}

export function normalizeNhlGame(raw: unknown): SportEvent | null {
  const game = object(raw);
  const id = str(field(game, "id"));
  const startTime = str(field(game, "startTimeUTC"));
  const awayTeam = object(field(game, "awayTeam"));
  const homeTeam = object(field(game, "homeTeam"));
  const awayName = teamName(awayTeam);
  const homeName = teamName(homeTeam);
  if (!id || !startTime || !awayName || !homeName) return null;

  const awayScore = scoreValue(field(awayTeam, "score"));
  const homeScore = scoreValue(field(homeTeam, "score"));
  const status = gameStatus(game);
  const normalized: SportEvent = {
    id: `nhl-scoreboard:${id}`,
    sport: "hockey",
    name: `${awayName} @ ${homeName}`,
    startTime,
    venue: venueName(game),
    status,
    clock: clockText(game, status),
    score: awayScore !== undefined && homeScore !== undefined ? `${awayScore} - ${homeScore}` : undefined,
    source: "nhl-scoreboard",
    runners: [
      runner(`nhl-scoreboard:${id}:away`, awayName),
      runner(`nhl-scoreboard:${id}:home`, homeName),
    ],
    awayLogo: str(field(awayTeam, "logo")).trim() || undefined,
    homeLogo: str(field(homeTeam, "logo")).trim() || undefined,
  };

  return decorateRunners(normalized);
}

function runner(id: string, name: string): Runner {
  return { id, name, odds: [] };
}

function teamName(team: Obj): string {
  const abbrev = str(field(team, "abbrev")).trim();
  const nameObj = object(field(team, "name"));
  const name = str(field(nameObj, "default")).trim();
  return [abbrev, name].filter(Boolean).join(" ").trim();
}

function venueName(game: Obj): string | undefined {
  const venue = object(field(game, "venue"));
  return str(field(venue, "default")).trim() || undefined;
}

function gameStatus(game: Obj): SportEvent["status"] {
  const state = str(field(game, "gameState")).toUpperCase();
  if (["OFF", "FINAL"].includes(state)) return "finished";
  if (["LIVE", "CRIT"].includes(state)) return "live";

  const startTime = str(field(game, "startTimeUTC"));
  const start = Date.parse(startTime);
  return Number.isFinite(start) && start < Date.now() ? "live" : "upcoming";
}

function clockText(game: Obj, status: SportEvent["status"]): string | undefined {
  if (status === "finished") return "Final";

  const clock = object(field(game, "clock"));
  const remaining = str(field(clock, "timeRemaining")).trim();
  const periodDescriptor = object(field(game, "periodDescriptor"));
  const period = str(field(periodDescriptor, "number")).trim();
  if (status === "live" && remaining && period) return `P${period} ${remaining}`;
  if (status === "live" && period) return `P${period}`;
  return undefined;
}

function scoreValue(value: unknown): number | undefined {
  const parsed = Number(str(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function object(value: unknown): Obj {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : {};
}

function field(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) return (obj as Obj)[key];
  return undefined;
}

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}
