import type { OddsLine, Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard";

/**
 * No-key ESPN scoreboard fallback with DraftKings moneyline prices when ESPN
 * exposes them. This keeps baseball useful when paid providers 401/429.
 */
export class EspnMlbOddsAdapter implements SportAdapter {
  readonly sport = "baseball";
  readonly provider = "espn-mlb-odds";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    try {
      const res = await fetch(`${SCOREBOARD_URL}?dates=${espnDate()}`);
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }

      const events = normalizeEspnMlbScoreboard(await res.json());
      const priced = events.filter(hasOdds).length;
      if (events.length === 0) {
        return { mode: "live", events, message: "0 ESPN MLB games today" };
      }

      return {
        mode: "live",
        events,
        message: `${priced}/${events.length} MLB games with DraftKings moneyline odds from ESPN`,
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

export function normalizeEspnMlbScoreboard(body: unknown): SportEvent[] {
  return array(field(object(body), "events"))
    .map(normalizeEspnMlbEvent)
    .filter((event): event is SportEvent => event !== null);
}

export function normalizeEspnMlbEvent(raw: unknown): SportEvent | null {
  const event = object(raw);
  const id = str(field(event, "id"));
  const startTime = str(field(event, "date"));
  const competition = object(array(field(event, "competitions"))[0]);
  const competitors = array(field(competition, "competitors")).map(object);
  const away = competitors.find((row) => str(field(row, "homeAway")) === "away");
  const home = competitors.find((row) => str(field(row, "homeAway")) === "home");
  const awayName = teamName(away);
  const homeName = teamName(home);
  if (!id || !startTime || !away || !home || !awayName || !homeName) return null;

  const odds = oddsObject(field(competition, "odds"));
  const bookmaker = bookmakerName(odds);
  const awayRunner = runner(id, "away", awayName, oddsPrice(odds, "away"), bookmaker, startTime);
  const homeRunner = runner(id, "home", homeName, oddsPrice(odds, "home"), bookmaker, startTime);
  const awayScore = scoreValue(field(away, "score"));
  const homeScore = scoreValue(field(home, "score"));
  const status = object(field(competition, "status") ?? field(event, "status"));
  const statusType = object(field(status, "type"));

  const normalized: SportEvent = {
    id: `espn-mlb-odds:${id}`,
    sport: "baseball",
    name: `${awayName} @ ${homeName}`,
    startTime,
    venue: venueName(competition),
    status: eventStatus(statusType, startTime),
    clock: clockText(status),
    score: awayScore !== undefined && homeScore !== undefined ? `${awayScore} - ${homeScore}` : undefined,
    source: "espn-mlb-odds",
    runners: [awayRunner, homeRunner],
    awayLogo: teamLogo(away),
    homeLogo: teamLogo(home),
  };

  return decorateRunners(normalized);
}

function runner(
  eventId: string,
  side: "away" | "home",
  name: string,
  price: number | undefined,
  bookmaker: string,
  lastUpdate: string,
): Runner {
  const runnerId = `espn-mlb-odds:${eventId}:${side}`;
  const odds: OddsLine[] = price
    ? [{
        bookmaker,
        runnerId,
        price,
        impliedProbability: 0,
        lastUpdate,
      }]
    : [];
  return { id: runnerId, name, odds };
}

function oddsPrice(odds: Obj, side: "away" | "home"): number | undefined {
  const moneyline = object(field(odds, "moneyline"));
  const sideOdds = object(field(moneyline, side));
  const close = object(field(sideOdds, "close"));
  return decimalFromAmerican(field(close, "odds"));
}

function oddsObject(value: unknown): Obj {
  const values = array(value);
  if (values.length > 0) return object(values[0]);
  return object(value);
}

function decimalFromAmerican(value: unknown): number | undefined {
  const text = str(value).replace(/[^0-9+-]/g, "");
  if (!text || text === "+0" || text === "-0" || text === "0") return undefined;
  const american = Number(text);
  if (!Number.isFinite(american) || american === 0) return undefined;
  const decimal = american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
  return Number(decimal.toFixed(3));
}

function bookmakerName(odds: Obj): string {
  const provider = object(field(odds, "provider"));
  return str(field(provider, "displayName") ?? field(provider, "name")).trim() || "ESPN";
}

function teamName(row: Obj | undefined): string {
  const team = object(field(row, "team"));
  return str(field(team, "displayName") ?? field(team, "name")).trim();
}

function teamLogo(row: Obj | undefined): string | undefined {
  const team = object(field(row, "team"));
  return str(field(team, "logo")).trim() || undefined;
}

function venueName(competition: Obj): string | undefined {
  const venue = object(field(competition, "venue"));
  return str(field(venue, "fullName")).trim() || undefined;
}

function eventStatus(statusType: Obj, startTime: string): SportEvent["status"] {
  const state = str(field(statusType, "state")).toLowerCase();
  const name = str(field(statusType, "name")).toLowerCase();
  const completed = field(statusType, "completed") === true;
  if (completed || state === "post" || name.includes("final")) return "finished";
  if (state === "in" || name.includes("progress")) return "live";

  const start = Date.parse(startTime);
  return Number.isFinite(start) && start < Date.now() ? "live" : "upcoming";
}

function clockText(status: Obj): string | undefined {
  const type = object(field(status, "type"));
  return str(field(type, "shortDetail") ?? field(type, "detail") ?? field(type, "description")).trim() || undefined;
}

function scoreValue(value: unknown): number | undefined {
  const parsed = Number(str(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasOdds(event: SportEvent): boolean {
  return event.runners.some((eventRunner) => eventRunner.odds.length > 0);
}

function espnDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}${part("month")}${part("day")}`;
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
