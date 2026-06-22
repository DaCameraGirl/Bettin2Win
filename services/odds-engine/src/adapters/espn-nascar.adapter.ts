import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;

const SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/racing/nascar-premier/scoreboard";
const MAX_DRIVERS = 40;

/**
 * No-key NASCAR Cup leaderboard from ESPN's public nascar-premier scoreboard.
 *
 * Exposes real race names, venues, finishing order, and live/final status.
 * Does not include sportsbook prices.
 */
export class EspnNascarAdapter implements SportAdapter {
  readonly sport = "nascar";
  readonly provider = "espn-nascar";

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

      const events = normalizeEspnNascarScoreboard(await res.json());
      if (events.length === 0) {
        return { mode: "live", events, message: "0 NASCAR Cup races in ESPN window" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} NASCAR Cup race${events.length === 1 ? "" : "s"} from ESPN`,
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

export function normalizeEspnNascarScoreboard(body: unknown): SportEvent[] {
  return array(field(object(body), "events"))
    .map(normalizeEspnNascarEvent)
    .filter((event): event is SportEvent => event !== null);
}

export function normalizeEspnNascarEvent(raw: unknown): SportEvent | null {
  const event = object(raw);
  const id = str(field(event, "id"));
  const startTime = str(field(event, "date"));
  const name = str(field(event, "shortName") ?? field(event, "name")).trim();
  if (!id || !startTime || !name) return null;

  const competition = object(array(field(event, "competitions"))[0]);
  const status = object(field(competition, "status") ?? field(event, "status"));
  const statusType = object(field(status, "type"));
  const runners = array(field(competition, "competitors"))
    .map((competitor) => normalizeDriver(id, competitor))
    .filter((runner): runner is Runner => runner !== null)
    .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
    .slice(0, MAX_DRIVERS);

  const normalized: SportEvent = {
    id: `espn-nascar:${id}`,
    sport: "nascar",
    name,
    startTime,
    venue: venueName(competition),
    status: eventStatus(statusType, startTime, str(field(event, "endDate"))),
    clock: clockText(status),
    source: "espn-nascar",
    runners,
  };

  return decorateRunners(normalized);
}

function normalizeDriver(eventId: string, raw: unknown): Runner | null {
  const row = object(raw);
  const athlete = object(field(row, "athlete"));
  const id = str(field(row, "id") ?? field(athlete, "id"));
  const name = str(field(athlete, "displayName") ?? field(athlete, "fullName")).trim();
  if (!id || !name) return null;

  const position = number(field(row, "order"));
  const carNumber = number(field(row, "carNumber"));
  const winner = field(row, "winner") === true;
  const label = winner && position === 1 ? `${name} (Winner)` : name;

  return {
    id: `espn-nascar:${eventId}:${id}`,
    name: label,
    number: carNumber ?? position,
    position,
    odds: [],
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
  return Number.isFinite(start) && start < now ? "live" : "upcoming";
}

function venueName(competition: Obj): string | undefined {
  const venue = object(field(competition, "venue"));
  return str(field(venue, "fullName") ?? field(venue, "displayName")).trim() || undefined;
}

function clockText(status: Obj): string | undefined {
  const type = object(field(status, "type"));
  return str(field(type, "shortDetail") ?? field(type, "detail") ?? field(type, "description")).trim() || undefined;
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