import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;

const LEAGUES = [
  { code: "eng.1", label: "Premier League" },
  { code: "usa.1", label: "MLS" },
  { code: "esp.1", label: "La Liga" },
  { code: "uefa.champions", label: "Champions League" },
] as const;

/**
 * No-key soccer scoreboard sweep from ESPN. Gives soccer a real game feed when
 * RapidAPI providers 429 or are unreachable.
 */
export class EspnSoccerScoreboardAdapter implements SportAdapter {
  readonly sport = "soccer";
  readonly provider = "espn-soccer";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    const events: SportEvent[] = [];
    let reached = false;

    try {
      for (const league of LEAGUES) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`;
        const res = await fetch(url);
        if (!res.ok) continue;
        reached = true;
        for (const event of normalizeEspnSoccerScoreboard(await res.json(), league.label)) {
          if (!events.some((row) => row.id === event.id)) events.push(event);
        }
        await sleep(150);
      }

      if (!reached) {
        return { mode: "mock", events: generateMockEvents(this.sport), message: "provider unreachable" };
      }

      if (events.length === 0) {
        return { mode: "live", events, message: "0 soccer matches in ESPN window" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} real soccer match${events.length === 1 ? "" : "es"} from ESPN (odds unavailable)`,
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

export function normalizeEspnSoccerScoreboard(body: unknown, leagueLabel: string): SportEvent[] {
  return array(field(object(body), "events"))
    .map((raw) => normalizeEspnSoccerEvent(raw, leagueLabel))
    .filter((event): event is SportEvent => event !== null);
}

export function normalizeEspnSoccerEvent(raw: unknown, leagueLabel: string): SportEvent | null {
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
    id: `espn-soccer:${id}`,
    sport: "soccer",
    name: `${awayName} @ ${homeName}`,
    startTime,
    venue: leagueLabel,
    status: eventStatus(statusType, startTime),
    clock: clockText(status),
    score: awayScore !== undefined && homeScore !== undefined ? `${awayScore} - ${homeScore}` : undefined,
    source: "espn-soccer",
    runners: [
      runner(`espn-soccer:${id}:away`, awayName),
      runner(`espn-soccer:${id}:home`, homeName),
      runner(`espn-soccer:${id}:draw`, "Draw"),
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
  return str(field(teamObj, "displayName")).trim() || str(field(teamObj, "abbreviation")).trim();
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
  return str(field(statusType, "shortDetail")).trim() || undefined;
}

function scoreValue(value: unknown): number | undefined {
  const parsed = Number(str(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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