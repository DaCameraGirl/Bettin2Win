import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
const MAX_LEADERBOARD_PLAYERS = 24;

/**
 * No-key PGA leaderboard fallback from ESPN's public scoreboard endpoint.
 *
 * It does not expose sportsbook odds, but it gives live tournament status,
 * round detail, leaderboard order, and player scores.
 */
export class EspnGolfAdapter implements SportAdapter {
  readonly sport = "golf";
  readonly provider = "espn-golf";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    try {
      const res = await fetch(SCOREBOARD_URL);
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }

      const events = normalizeEspnGolfScoreboard(await res.json());
      if (events.length === 0) {
        return { mode: "live", events, message: "0 PGA tournaments today" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} PGA leaderboard${events.length === 1 ? "" : "s"} from ESPN`,
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

export function normalizeEspnGolfScoreboard(body: unknown): SportEvent[] {
  return array(field(object(body), "events"))
    .map(normalizeEspnGolfEvent)
    .filter((event): event is SportEvent => event !== null);
}

export function normalizeEspnGolfEvent(raw: unknown): SportEvent | null {
  const event = object(raw);
  const id = str(field(event, "id"));
  const startTime = str(field(event, "date"));
  const name = str(field(event, "shortName") ?? field(event, "name")).trim();
  if (!id || !startTime || !name) return null;

  const competition = object(array(field(event, "competitions"))[0]);
  const status = object(field(competition, "status") ?? field(event, "status"));
  const statusType = object(field(status, "type"));
  const runners = array(field(competition, "competitors"))
    .map((competitor) => normalizeGolfer(id, competitor))
    .filter((runner): runner is Runner => runner !== null)
    .slice(0, MAX_LEADERBOARD_PLAYERS);

  const normalized: SportEvent = {
    id: `espn-golf:${id}`,
    sport: "golf",
    name,
    startTime,
    venue: leagueName(event),
    status: eventStatus(statusType, startTime, str(field(event, "endDate"))),
    clock: str(field(statusType, "shortDetail") ?? field(statusType, "detail") ?? field(statusType, "description")).trim() || undefined,
    source: "espn-golf",
    runners,
  };

  return decorateRunners(normalized);
}

function normalizeGolfer(eventId: string, raw: unknown): Runner | null {
  const row = object(raw);
  const athlete = object(field(row, "athlete"));
  const id = str(field(row, "id") ?? field(athlete, "id"));
  const name = str(field(athlete, "displayName") ?? field(athlete, "fullName")).trim();
  if (!id || !name) return null;

  const position = number(field(row, "order"));
  const score = str(field(row, "score")).trim();
  const roundScore = roundDisplay(row);
  const suffix = [score, roundScore ? `R${roundScore.period} ${roundScore.score}` : ""]
    .filter(Boolean)
    .join(" / ");

  return {
    id: `espn-golf:${eventId}:${id}`,
    name: suffix ? `${name} (${suffix})` : name,
    number: position,
    position,
    odds: [],
  };
}

function roundDisplay(row: Obj): { period: string; score: string } | undefined {
  const scores = array(field(row, "linescores"))
    .map(object)
    .filter((line) => str(field(line, "displayValue")).trim());
  const latest = scores.at(-1);
  if (!latest) return undefined;
  return {
    period: str(field(latest, "period")),
    score: str(field(latest, "displayValue")).trim(),
  };
}

function eventStatus(statusType: Obj, startTime: string, endTime: string): SportEvent["status"] {
  const state = str(field(statusType, "state")).toLowerCase();
  const name = str(field(statusType, "name")).toLowerCase();
  const completed = field(statusType, "completed") === true;
  if (completed || state === "post" || name.includes("final")) return "finished";
  if (state === "in" || name.includes("progress")) return "live";

  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  const now = Date.now();
  if (Number.isFinite(start) && Number.isFinite(end) && start <= now && now <= end) return "live";
  return "upcoming";
}

function leagueName(event: Obj): string | undefined {
  const season = object(field(event, "season"));
  const seasonYear = str(field(season, "year"));
  return seasonYear ? `PGA TOUR ${seasonYear}` : "PGA TOUR";
}

function number(value: unknown): number | undefined {
  const parsed = Number(str(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
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
