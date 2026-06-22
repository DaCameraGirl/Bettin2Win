import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
type Obj = Record<string, unknown>;

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

/**
 * No-key NFL scoreboard from ESPN. Keeps football on a real game feed when paid
 * providers 401/429 and Highlightly is unavailable.
 */
export class EspnNflScoreboardAdapter implements SportAdapter {
  readonly sport = "football";
  readonly provider = "espn-nfl";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    try {
      const res = await fetch(SCOREBOARD_URL);
      if (!res.ok) {
        return { mode: "live", events: [], message: `provider ${res.status}` };
      }

      const events = normalizeEspnNflScoreboard(await res.json());
      if (events.length === 0) {
        return { mode: "live", events, message: "0 NFL games in ESPN window" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} real NFL game${events.length === 1 ? "" : "s"} from ESPN (odds unavailable)`,
      };
    } catch (err) {
      return {
        mode: "live",
        events: [],
        message: err instanceof Error ? err.message : "fetch failed",
      };
    }
  }
}

export function normalizeEspnNflScoreboard(body: unknown): SportEvent[] {
  return array(field(object(body), "events"))
    .map(normalizeEspnNflEvent)
    .filter((event): event is SportEvent => event !== null);
}

export function normalizeEspnNflEvent(raw: unknown): SportEvent | null {
  const event = object(raw);
  const id = str(field(event, "id"));
  const startTime = str(field(event, "date"));
  const competition = object(array(field(event, "competitions"))[0]);
  const competitors = array(field(competition, "competitors")).map(object);
  const away = competitors.find((row) => str(field(row, "homeAway")) === "away");
  const home = competitors.find((row) => str(field(row, "homeAway")) === "home");
  const awayName = teamName(away!);
  const homeName = teamName(home!);
  if (!id || !startTime || !away || !home || !awayName || !homeName) return null;

  const awayScore = scoreValue(field(away, "score"));
  const homeScore = scoreValue(field(home, "score"));
  const status = object(field(competition, "status") ?? field(event, "status"));
  const statusType = object(field(status, "type"));

  const normalized: SportEvent = {
    id: `espn-nfl:${id}`,
    sport: "football",
    name: `${awayName} @ ${homeName}`,
    startTime,
    venue: venueName(competition),
    status: eventStatus(statusType, startTime),
    clock: clockText(status),
    score: awayScore !== undefined && homeScore !== undefined ? `${awayScore} - ${homeScore}` : undefined,
    source: "espn-nfl",
    runners: [
      runner(`espn-nfl:${id}:away`, awayName),
      runner(`espn-nfl:${id}:home`, homeName),
    ],
    awayLogo: teamLogo(away!),
    homeLogo: teamLogo(home!),
  };

  return decorateRunners(normalized);
}

function runner(id: string, name: string): Runner {
  return { id, name, odds: [] };
}

function teamName(team: Obj): string {
  const teamObj = object(field(team, "team"));
  const abbrev = str(field(teamObj, "abbreviation")).trim();
  const display = str(field(teamObj, "displayName")).trim();
  const short = str(field(teamObj, "shortDisplayName")).trim();
  return abbrev || short || display;
}

function venueName(competition: Obj): string | undefined {
  const venue = array(field(competition, "venue"))[0];
  const venueObj = object(venue);
  return str(field(venueObj, "fullName")).trim() || undefined;
}

function teamLogo(team: Obj): string | undefined {
  const teamObj = object(field(team, "team"));
  const logos = array(field(teamObj, "logos"));
  const logo = object(logos[0]);
  return str(field(logo, "href")).trim() || undefined;
}

function eventStatus(statusType: Obj, startTime: string): SportEvent["status"] {
  const state = str(field(statusType, "state")).toLowerCase();
  const completed = Boolean(field(statusType, "completed"));
  if (completed || state === "post") return "finished";
  if (state === "in") return "live";
  const start = Date.parse(startTime);
  return Number.isFinite(start) && start < Date.now() ? "live" : "upcoming";
}

function clockText(status: Obj): string | undefined {
  const statusType = object(field(status, "type"));
  const detail = str(field(statusType, "shortDetail")).trim();
  return detail || undefined;
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