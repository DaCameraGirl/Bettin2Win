import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;

const MLB_STATS_URL = "https://statsapi.mlb.com/api/v1/schedule";

/**
 * Official public MLB schedule/linescore fallback.
 *
 * This feed does not provide sportsbook prices, but it does provide the thing
 * users notice first on game day: real games, live/final status, score, and
 * inning. It needs no app key, so baseball can stay useful when paid/limited
 * odds providers return 401/429.
 */
export class MlbStatsAdapter implements SportAdapter {
  readonly sport = "baseball";
  readonly provider = "mlb-stats";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    const date = easternDate();
    const url = `${MLB_STATS_URL}?sportId=1&date=${date}&hydrate=linescore,team`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }

      const events = normalizeMlbStatsSchedule(await res.json());
      if (events.length === 0) {
        return { mode: "live", events, message: "0 real MLB games today" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} real MLB schedule/score card${events.length === 1 ? "" : "s"} (odds unavailable)`,
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

export function normalizeMlbStatsSchedule(body: unknown): SportEvent[] {
  const out: SportEvent[] = [];
  for (const dateRow of array(field(object(body), "dates"))) {
    for (const game of array(field(object(dateRow), "games"))) {
      const event = normalizeMlbStatsGame(game);
      if (event) out.push(event);
    }
  }
  return out;
}

export function normalizeMlbStatsGame(raw: unknown): SportEvent | null {
  const game = object(raw);
  const gamePk = str(field(game, "gamePk"));
  const startTime = str(field(game, "gameDate"));
  const teams = object(field(game, "teams"));
  const awayRow = object(field(teams, "away"));
  const homeRow = object(field(teams, "home"));
  const away = teamName(awayRow);
  const home = teamName(homeRow);
  if (!gamePk || !startTime || !away || !home) return null;

  const linescore = object(field(game, "linescore"));
  const status = object(field(game, "status"));
  const awayScore = scoreValue(field(awayRow, "score"));
  const homeScore = scoreValue(field(homeRow, "score"));
  const event: SportEvent = {
    id: `mlb-stats:${gamePk}`,
    sport: "baseball",
    name: `${away} @ ${home}`,
    startTime,
    venue: venueName(game),
    status: gameStatus(status),
    clock: clockText(status, linescore),
    score: awayScore !== undefined && homeScore !== undefined ? `${awayScore} - ${homeScore}` : undefined,
    source: "mlb-stats",
    runners: [runner(`mlb-stats:${gamePk}:away`, away), runner(`mlb-stats:${gamePk}:home`, home)],
  };

  return decorateRunners(event);
}

function runner(id: string, name: string): Runner {
  return { id, name, odds: [] };
}

function teamName(teamSide: Obj): string {
  const team = object(field(teamSide, "team"));
  return str(field(team, "name")).trim();
}

function venueName(game: Obj): string {
  const venue = object(field(game, "venue"));
  return str(field(venue, "name")).trim() || "MLB";
}

function gameStatus(status: Obj): SportEvent["status"] {
  const abstractState = str(field(status, "abstractGameState")).toLowerCase();
  const detailedState = str(field(status, "detailedState")).toLowerCase();
  const codedState = str(field(status, "codedGameState")).toUpperCase();

  if (
    abstractState.includes("final") ||
    detailedState.includes("final") ||
    detailedState.includes("game over") ||
    codedState === "F" ||
    codedState === "O"
  ) {
    return "finished";
  }

  if (
    abstractState.includes("live") ||
    detailedState.includes("progress") ||
    detailedState.includes("in progress")
  ) {
    return "live";
  }

  return "upcoming";
}

function clockText(status: Obj, linescore: Obj): string | undefined {
  const eventStatus = gameStatus(status);
  if (eventStatus === "finished") return "Final";

  const inning = str(field(linescore, "currentInningOrdinal")).trim();
  const inningState = str(field(linescore, "inningState")).trim();
  if (eventStatus === "live" && inning && inningState) return `${inningState} ${inning}`;
  if (eventStatus === "live" && inning) return inning;

  const detailed = str(field(status, "detailedState")).trim();
  return detailed || undefined;
}

function scoreValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = str(value).trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function easternDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
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
