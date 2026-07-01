import type { OddsLine, Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import {
  enrichEspnEventsFromSummary,
  eventIdFromEspnEvent,
  type EspnSummaryTarget,
} from "./espn-summary-odds.js";

type Obj = Record<string, unknown>;

const LEAGUES = [
  { code: "eng.1", label: "Premier League" },
  { code: "eng.2", label: "Championship" },
  { code: "usa.1", label: "MLS" },
  { code: "usa.nwsl", label: "NWSL" },
  { code: "esp.1", label: "La Liga" },
  { code: "ger.1", label: "Bundesliga" },
  { code: "ita.1", label: "Serie A" },
  { code: "fra.1", label: "Ligue 1" },
  { code: "ned.1", label: "Eredivisie" },
  { code: "mex.1", label: "Liga MX" },
  { code: "uefa.champions", label: "Champions League" },
  { code: "uefa.europa", label: "Europa League" },
  { code: "fifa.world", label: "International" },
] as const;

/**
 * No-key soccer scoreboard sweep from ESPN with DraftKings 3-way moneylines
 * when ESPN exposes them for a league.
 */
export class EspnSoccerScoreboardAdapter implements SportAdapter {
  readonly sport = "soccer";
  readonly provider = "espn-soccer-odds";

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    const events: SportEvent[] = [];
    const summaryTargets: EspnSummaryTarget[] = [];
    let reached = false;

    try {
      for (const league of LEAGUES) {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`;
        const res = await fetch(url);
        if (!res.ok) continue;
        reached = true;
        for (const event of normalizeEspnSoccerScoreboard(await res.json(), league.label, league.code)) {
          if (!events.some((row) => row.id === event.id)) {
            events.push(event);
            summaryTargets.push({
              sportPath: "soccer",
              leagueCode: league.code,
              eventId: eventIdFromEspnEvent(event),
            });
          }
        }
        await sleep(150);
      }

      if (!reached) {
        return { mode: "live", events: [], message: "ESPN soccer scoreboards unreachable" };
      }

      const enriched = await enrichEspnEventsFromSummary(events, summaryTargets, 10);
      const priced = enriched.filter(hasOdds).length;
      if (enriched.length === 0) {
        return { mode: "live", events: enriched, message: "0 soccer matches in ESPN window" };
      }

      const oddsNote = priced > 0
        ? `${priced}/${enriched.length} matches with DraftKings moneyline odds`
        : "odds unavailable";
      return {
        mode: "live",
        events: enriched,
        message: `${enriched.length} real soccer match${enriched.length === 1 ? "" : "es"} from ESPN (${oddsNote})`,
      };
    } catch (err) {
      return {
        mode: "live",
        events: [],
        message: err instanceof Error ? err.message : "ESPN soccer fetch failed",
      };
    }
  }
}

export function normalizeEspnSoccerScoreboard(
  body: unknown,
  leagueLabel: string,
  leagueCode = "soccer",
): SportEvent[] {
  return array(field(object(body), "events"))
    .map((raw) => normalizeEspnSoccerEvent(raw, leagueLabel, leagueCode))
    .filter((event): event is SportEvent => event !== null);
}

export function normalizeEspnSoccerEvent(
  raw: unknown,
  leagueLabel: string,
  leagueCode = "soccer",
): SportEvent | null {
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
  const drawRunner = runner(id, "draw", "Draw", oddsPrice(odds, "draw"), bookmaker, startTime);
  const awayScore = scoreValue(field(away, "score"));
  const homeScore = scoreValue(field(home, "score"));
  const status = object(field(competition, "status") ?? field(event, "status"));
  const statusType = object(field(status, "type"));

  const normalized: SportEvent = {
    id: `espn-soccer-odds:${leagueCode}:${id}`,
    sport: "soccer",
    name: `${awayName} @ ${homeName}`,
    startTime,
    venue: leagueLabel,
    status: eventStatus(statusType, startTime),
    clock: clockText(status),
    score: awayScore !== undefined && homeScore !== undefined ? `${awayScore} - ${homeScore}` : undefined,
    source: "espn-soccer-odds",
    runners: [awayRunner, homeRunner, drawRunner],
    awayLogo: teamLogo(away),
    homeLogo: teamLogo(home),
  };

  return decorateRunners(normalized);
}

function runner(
  eventId: string,
  side: "away" | "home" | "draw",
  name: string,
  price: number | undefined,
  bookmaker: string,
  lastUpdate: string,
): Runner {
  const runnerId = `espn-soccer-odds:${eventId}:${side}`;
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

function oddsPrice(odds: Obj, side: "away" | "home" | "draw"): number | undefined {
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

function teamName(team: Obj | undefined): string {
  const teamObj = object(field(team, "team"));
  return str(field(teamObj, "displayName")).trim() || str(field(teamObj, "abbreviation")).trim();
}

function teamLogo(team: Obj | undefined): string | undefined {
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

function hasOdds(event: SportEvent): boolean {
  return event.runners.some((eventRunner) => eventRunner.odds.length > 0);
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