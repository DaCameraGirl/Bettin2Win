import type { OddsLine, Runner, SportEvent } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { HighlightlyMatchesAdapter } from "./highlightly-matches.adapter.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;

const HOST = "tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com";
const BOX_SCORE_CACHE_MS = 20_000;

const MLB_TEAMS: Record<string, string> = {
  ARI: "Arizona Diamondbacks",
  ATL: "Atlanta Braves",
  BAL: "Baltimore Orioles",
  BOS: "Boston Red Sox",
  CHC: "Chicago Cubs",
  CHW: "Chicago White Sox",
  CWS: "Chicago White Sox",
  CIN: "Cincinnati Reds",
  CLE: "Cleveland Guardians",
  COL: "Colorado Rockies",
  DET: "Detroit Tigers",
  HOU: "Houston Astros",
  KC: "Kansas City Royals",
  KCR: "Kansas City Royals",
  LAA: "Los Angeles Angels",
  LAD: "Los Angeles Dodgers",
  MIA: "Miami Marlins",
  MIL: "Milwaukee Brewers",
  MIN: "Minnesota Twins",
  NYM: "New York Mets",
  NYY: "New York Yankees",
  ATH: "Athletics",
  OAK: "Athletics",
  PHI: "Philadelphia Phillies",
  PIT: "Pittsburgh Pirates",
  SD: "San Diego Padres",
  SDP: "San Diego Padres",
  SEA: "Seattle Mariners",
  SF: "San Francisco Giants",
  SFG: "San Francisco Giants",
  STL: "St. Louis Cardinals",
  TB: "Tampa Bay Rays",
  TBR: "Tampa Bay Rays",
  TEX: "Texas Rangers",
  TOR: "Toronto Blue Jays",
  WAS: "Washington Nationals",
  WSH: "Washington Nationals",
  WSN: "Washington Nationals",
};

const BOOK_NAMES: Record<string, string> = {
  bet365: "Bet365",
  betmgm: "BetMGM",
  betrivers: "BetRivers",
  caesars: "Caesars",
  draftkings: "DraftKings",
  espnbet: "ESPN BET",
  fanduel: "FanDuel",
  fanatics: "Fanatics",
  pointsbet: "PointsBet",
};

export class Tank01MlbAdapter implements SportAdapter {
  readonly sport = "baseball";
  readonly provider = "tank01-mlb";

  hasCredentials(): boolean {
    return env.rapidApiKey.length > 0;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents(this.sport), message: "no RAPIDAPI_KEY" };
    }

    const date = todayYmd();
    const url = `https://${HOST}/getMLBBettingOdds?gameDate=${date}&playerProps=false&itemFormat=list`;

    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": HOST,
          "x-rapidapi-key": env.rapidApiKey,
        },
      });
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }

      const enrichment = await baseballEnrichment(date);
      const events = rows(await res.json())
        .map((row) => normalizeTank01MlbOdds(row, enrichment))
        .filter((event): event is SportEvent => event !== null);

      if (events.length === 0) {
        return { mode: "live", events, message: "0 real MLB odds today" };
      }

      return {
        mode: "live",
        events,
        message: `${events.length} real MLB odds board${events.length === 1 ? "" : "s"}`,
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

export interface Tank01MlbEnrichment {
  highlightly: SportEvent[];
  tank01Games: Map<string, Tank01Game>;
}

interface Tank01Game {
  gameId: string;
  startTime?: string;
  status?: SportEvent["status"];
  clock?: string;
  score?: string;
  venue?: string;
}

const boxScoreCache = new Map<string, { expiresAt: number; value: Partial<Tank01Game> | undefined }>();

export function normalizeTank01MlbOdds(
  raw: unknown,
  enrichment: SportEvent[] | Tank01MlbEnrichment = [],
): SportEvent | null {
  const row = object(raw);
  if (!row) return null;

  const gameId = str(field(row, "gameID"));
  const teams = teamsFromRow(row, gameId);
  if (!gameId || !teams) return null;

  const enrich = Array.isArray(enrichment)
    ? { highlightly: enrichment, tank01Games: new Map<string, Tank01Game>() }
    : enrichment;
  const highlighted = findEnrichment(enrich.highlightly, teams.away.name, teams.home.name);
  const tank01Game = enrich.tank01Games.get(gameId);
  const lastUpdate = lastUpdateIso(row);
  const awayRunner = runner(`tank01-mlb:${gameId}:away`, teams.away.name);
  const homeRunner = runner(`tank01-mlb:${gameId}:home`, teams.home.name);

  for (const book of array(field(row, "sportsBooks"))) {
    const bookObj = object(book);
    const odds = object(field(bookObj, "odds"));
    const bookmaker = bookmakerName(str(field(bookObj, "sportsBook") ?? field(bookObj, "book")));
    addLine(awayRunner, bookmaker, americanToDecimal(field(odds, "awayTeamML")), lastUpdate);
    addLine(homeRunner, bookmaker, americanToDecimal(field(odds, "homeTeamML")), lastUpdate);
  }

  const event: SportEvent = {
    id: `tank01-mlb:${gameId}`,
    sport: "baseball",
    name: `${teams.away.name} @ ${teams.home.name}`,
    startTime: highlighted?.startTime ?? tank01Game?.startTime ?? dateOnlyIso(str(field(row, "gameDate"))),
    venue: highlighted?.venue ?? tank01Game?.venue ?? "MLB",
    status: highlighted?.status ?? tank01Game?.status ?? inferStatus(str(field(row, "gameDate"))),
    clock: highlighted?.clock ?? tank01Game?.clock,
    score: highlighted?.score ?? tank01Game?.score,
    awayLogo: highlighted?.awayLogo,
    homeLogo: highlighted?.homeLogo,
    source: "tank01-mlb",
    runners: [awayRunner, homeRunner],
  };

  return decorateRunners(event);
}

async function baseballEnrichment(date: string): Promise<Tank01MlbEnrichment> {
  const [highlightly, tank01Games] = await Promise.all([highlightlyEnrichment(), tank01GameEnrichment(date)]);
  await enrichLiveBoxScores(tank01Games);
  return { highlightly, tank01Games };
}

async function highlightlyEnrichment(): Promise<SportEvent[]> {
  try {
    const result = await new HighlightlyMatchesAdapter("baseball").fetchEvents();
    return result.mode === "live" ? result.events : [];
  } catch {
    return [];
  }
}

async function tank01GameEnrichment(date: string): Promise<Map<string, Tank01Game>> {
  const url = `https://${HOST}/getMLBGamesForDate?gameDate=${date}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": HOST,
        "x-rapidapi-key": env.rapidApiKey,
      },
    });
    if (!res.ok) return new Map();

    const games = new Map<string, Tank01Game>();
    for (const row of rows(await res.json())) {
      const game = normalizeTank01Game(row);
      if (game) games.set(game.gameId, game);
    }
    return games;
  } catch {
    return new Map();
  }
}

function normalizeTank01Game(raw: unknown): Tank01Game | null {
  const row = object(raw);
  const gameId = str(field(row, "gameID"));
  if (!gameId) return null;
  return {
    gameId,
    startTime: epochIso(field(row, "gameTime_epoch")) ?? undefined,
    status: statusFromGame(row),
  };
}

async function enrichLiveBoxScores(games: Map<string, Tank01Game>): Promise<void> {
  const now = Date.now();
  const candidates = [...games.values()]
    .filter((game) => {
      if (game.status === "live") return true;
      const start = game.startTime ? Date.parse(game.startTime) : Number.NaN;
      return Number.isFinite(start) && start <= now && start > now - 4 * 60 * 60_000;
    })
    .slice(0, 6);

  await Promise.all(
    candidates.map(async (game) => {
      const box = await fetchBoxScore(game.gameId);
      if (box) Object.assign(game, box);
    }),
  );
}

async function fetchBoxScore(gameId: string): Promise<Partial<Tank01Game> | undefined> {
  const cached = boxScoreCache.get(gameId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const encoded = encodeURIComponent(gameId);
  const url =
    `https://${HOST}/getMLBBoxScore?gameID=${encoded}` +
    "&playerStatsFormat=list&startingLineups=false&fantasyPoints=false";

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": HOST,
        "x-rapidapi-key": env.rapidApiKey,
      },
    });
    if (!res.ok) return undefined;

    const box = normalizeBoxScore(object(field(await res.json(), "body")));
    boxScoreCache.set(gameId, { expiresAt: Date.now() + BOX_SCORE_CACHE_MS, value: box });
    return box;
  } catch {
    boxScoreCache.set(gameId, { expiresAt: Date.now() + BOX_SCORE_CACHE_MS, value: undefined });
    return undefined;
  }
}

function normalizeBoxScore(body: Obj): Partial<Tank01Game> {
  const lineScore = object(field(body, "lineScore"));
  const awayLine = object(field(lineScore, "away"));
  const homeLine = object(field(lineScore, "home"));
  const awayRuns = str(field(awayLine, "R")).trim();
  const homeRuns = str(field(homeLine, "R")).trim();

  return {
    status: statusFromGame(body),
    clock: clockFromBoxScore(body),
    score: awayRuns && homeRuns ? `${awayRuns} - ${homeRuns}` : undefined,
    venue: str(field(body, "Venue")).trim() || undefined,
  };
}

function teamsFromRow(row: Obj, gameId: string): { away: Team; home: Team } | null {
  const awayCode = code(str(field(row, "awayTeam")));
  const homeCode = code(str(field(row, "homeTeam")));
  if (awayCode && homeCode) return { away: team(awayCode), home: team(homeCode) };

  const parsed = /_(?<away>[A-Z]{2,3})@(?<home>[A-Z]{2,3})$/.exec(gameId);
  const parsedAway = parsed?.groups?.away;
  const parsedHome = parsed?.groups?.home;
  if (!parsedAway || !parsedHome) return null;
  return { away: team(parsedAway), home: team(parsedHome) };
}

interface Team {
  code: string;
  name: string;
}

function team(value: string): Team {
  const codeValue = code(value);
  return { code: codeValue, name: MLB_TEAMS[codeValue] ?? codeValue };
}

function runner(id: string, name: string): Runner {
  return { id, name, odds: [] };
}

function addLine(runnerValue: Runner, bookmaker: string, price: number | undefined, lastUpdate: string): void {
  if (!price) return;
  const line: OddsLine = {
    bookmaker,
    runnerId: runnerValue.id,
    price,
    impliedProbability: 0,
    lastUpdate,
  };
  runnerValue.odds.push(line);
}

function americanToDecimal(value: unknown): number | undefined {
  const text = str(value).trim().toUpperCase();
  if (!text || text === "N/A") return undefined;
  if (text === "EVEN" || text === "EV") return 2;

  const american = Number(text.replace(/^\+/, ""));
  if (!Number.isFinite(american) || american === 0) return undefined;
  if (american > 0) return round(1 + american / 100);
  return round(1 + 100 / Math.abs(american));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function findEnrichment(events: SportEvent[], away: string, home: string): SportEvent | undefined {
  const exact = canonical(`${away} @ ${home}`);
  const found = events.find((event) => canonical(event.name) === exact);
  if (found) return found;

  const awayToken = teamToken(away);
  const homeToken = teamToken(home);
  return events.find((event) => {
    const key = canonical(event.name);
    return key.includes(awayToken) && key.includes(homeToken);
  });
}

function teamToken(name: string): string {
  const parts = canonical(name).split(" ").filter(Boolean);
  return parts.at(-1) ?? canonical(name);
}

function canonical(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function bookmakerName(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (BOOK_NAMES[key]) return BOOK_NAMES[key];
  return raw
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Sportsbook";
}

function lastUpdateIso(row: Obj): string {
  const epoch = Number(str(field(row, "last_updated_e_time")));
  if (Number.isFinite(epoch) && epoch > 0) {
    return new Date(epoch * 1000).toISOString();
  }
  return new Date().toISOString();
}

function inferStatus(gameDate: string): SportEvent["status"] {
  const start = Date.parse(dateOnlyIso(gameDate));
  if (!Number.isFinite(start)) return "upcoming";
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (start < todayStart) return "finished";
  if (start === todayStart) return "upcoming";
  return "upcoming";
}

function statusFromGame(row: Obj): SportEvent["status"] | undefined {
  const status = str(field(row, "gameStatus") ?? field(row, "gameStatusCode") ?? field(row, "currentInning")).toLowerCase();
  const code = str(field(row, "gameStatusCode")).trim();
  if (status.includes("final") || status.includes("complete")) return "finished";
  if (status.includes("progress") || status.includes("live") || status.includes("inning")) return "live";
  if (code === "1") return "live";
  if (code === "2") return "finished";
  return undefined;
}

function clockFromBoxScore(row: Obj): string | undefined {
  const inning = str(field(row, "currentInning")).replace(/\s+/g, " ").trim();
  const outs = str(field(row, "currentOuts")).trim();
  if (inning && outs) return `${inning} - ${outs} out${outs === "1" ? "" : "s"}`;
  return inning || str(field(row, "gameStatus")).trim() || undefined;
}

function epochIso(value: unknown): string | undefined {
  const epoch = Number(str(value));
  if (!Number.isFinite(epoch) || epoch <= 0) return undefined;
  return new Date(epoch * 1000).toISOString();
}

function dateOnlyIso(yyyymmdd: string): string {
  const match = /^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})$/.exec(yyyymmdd);
  if (!match?.groups) return new Date().toISOString();
  const { year, month, day } = match.groups;
  return new Date(`${year}-${month}-${day}T12:00:00.000Z`).toISOString();
}

function rows(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const bodyObj = object(body);
  const bodyRows = field(bodyObj, "body");
  if (Array.isArray(bodyRows)) return bodyRows;
  const dataRows = field(bodyObj, "data");
  if (Array.isArray(dataRows)) return dataRows;
  return [];
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

function code(value: string): string {
  return value.trim().toUpperCase();
}

function todayYmd(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}
