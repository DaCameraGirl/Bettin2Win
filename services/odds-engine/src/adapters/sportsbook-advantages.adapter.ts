import type { OddsLine, Runner, SportEvent, SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

type Obj = Record<string, unknown>;
type SportsbookSport = Extract<SportKey, "football" | "baseball" | "basketball" | "hockey">;

const HOST = "sportsbook-api2.p.rapidapi.com";
const CACHE_MS = 30_000;
const MAX_EVENTS = 12;

const SPORT_MAP: Record<SportsbookSport, string[]> = {
  football: ["AMERICAN_FOOTBALL"],
  baseball: ["BASEBALL"],
  basketball: ["BASKETBALL"],
  hockey: ["ICE_HOCKEY", "HOCKEY"],
};

let cache: { expiresAt: number; body: unknown } | undefined;
let pending: Promise<unknown> | undefined;

/**
 * Sportsbook API exposes value opportunities such as arbitrage/middles rather
 * than a plain all-games board. This adapter is a real backup feed for sports
 * where a normal odds provider is down, and labels cards as opportunities.
 */
export class SportsbookAdvantagesAdapter implements SportAdapter {
  readonly provider = "sportsbook-api";

  constructor(readonly sport: SportsbookSport) {}

  hasCredentials(): boolean {
    return env.rapidApiKey.length > 0;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents(this.sport), message: "no RAPIDAPI_KEY" };
    }

    try {
      const body = await fetchAdvantages();
      const events = normalizeSportsbookAdvantages(this.sport, body);
      if (events.length === 0) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: "sportsbook-api returned no opportunities for this sport",
        };
      }
      return {
        mode: "live",
        events,
        message: `${events.length} real ${this.sport} sportsbook opportunities`,
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

export function normalizeSportsbookAdvantages(sport: SportsbookSport, body: unknown): SportEvent[] {
  const wanted = new Set(SPORT_MAP[sport]);
  const grouped = new Map<string, AdvantageGroup>();

  for (const item of advantages(body)) {
    const context = object(field(item, "context"));
    if (!wanted.has(str(field(context, "eventSport")))) continue;

    const group = groupFromAdvantage(sport, item);
    if (!group) continue;
    const existing = grouped.get(group.key);
    if (existing) mergeGroup(existing, group);
    else grouped.set(group.key, group);
  }

  return [...grouped.values()]
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, MAX_EVENTS)
    .map(groupToEvent);
}

async function fetchAdvantages(): Promise<unknown> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.body;
  if (pending) return pending;

  pending = fetch(`https://${HOST}/v1/advantages/`, {
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": HOST,
      "x-rapidapi-key": env.rapidApiKey,
    },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`provider ${res.status}`);
      const body = await res.json();
      cache = { expiresAt: Date.now() + CACHE_MS, body };
      return body;
    })
    .finally(() => {
      pending = undefined;
    });

  return pending;
}

interface AdvantageGroup {
  key: string;
  sport: SportsbookSport;
  eventName: string;
  startTime: string;
  venue: string;
  value?: number;
  live: boolean;
  runners: Map<string, Runner>;
}

function groupFromAdvantage(sport: SportsbookSport, raw: Obj): AdvantageGroup | null {
  const context = object(field(raw, "context"));
  const eventName = str(field(context, "eventName"));
  const startTime = str(field(context, "eventStartTime"));
  const eventKey = str(field(context, "eventKey")) || `${sport}:${eventName}`;
  const rawType = str(field(raw, "type")) || "OPPORTUNITY";
  const value = number(field(raw, "value"));
  const marketType = str(field(context, "marketType"));
  const marketSegment = str(field(context, "marketSegment"));
  if (!eventName || !startTime) return null;

  const participants = participantNames(context);
  const runners = new Map<string, Runner>();
  for (const [outcomeIndex, outcome] of array(field(raw, "outcomes")).entries()) {
    const runner = runnerFromOutcome(eventKey, outcome, outcomeIndex, participants);
    if (!runner) continue;
    const existing = runners.get(runner.name);
    if (existing) mergeRunnerOdds(existing, runner);
    else runners.set(runner.name, runner);
  }
  if (runners.size === 0) return null;

  return {
    key: [eventKey, rawType, marketType, marketSegment].join(":"),
    sport,
    eventName,
    startTime,
    venue: opportunityVenue(context, rawType, value, marketType),
    value,
    live: isLive(raw, startTime),
    runners,
  };
}

function mergeGroup(target: AdvantageGroup, source: AdvantageGroup): void {
  if ((source.value ?? 0) > (target.value ?? 0)) {
    target.value = source.value;
    target.venue = source.venue;
  }
  target.live = target.live || source.live;
  for (const [name, runner] of source.runners) {
    const existing = target.runners.get(name);
    if (existing) mergeRunnerOdds(existing, runner);
    else target.runners.set(name, runner);
  }
}

function groupToEvent(group: AdvantageGroup): SportEvent {
  const event: SportEvent = {
    id: `sportsbook-api:${group.key}`,
    sport: group.sport,
    name: group.eventName,
    startTime: group.startTime,
    venue: group.venue,
    status: group.live ? "live" : "upcoming",
    source: "sportsbook-api",
    runners: [...group.runners.values()],
  };
  return decorateRunners(event);
}

function runnerFromOutcome(
  eventKey: string,
  raw: unknown,
  index: number,
  participants: Map<string, string>,
): Runner | null {
  const outcome = object(raw);
  const price = number(field(outcome, "payout"));
  if (!price || price <= 1) return null;

  const participantKey = str(field(outcome, "participantKey"));
  const name = outcomeName(outcome, participants.get(participantKey));
  const runnerId = `sportsbook-api:${eventKey}:${index}:${slug(name)}`;
  const line: OddsLine = {
    bookmaker: sportsbookName(str(field(outcome, "source"))),
    runnerId,
    price,
    impliedProbability: 0,
    lastUpdate: str(field(outcome, "time")) || new Date().toISOString(),
  };
  return { id: runnerId, name, odds: [line] };
}

function mergeRunnerOdds(target: Runner, source: Runner): void {
  const seen = new Set(target.odds.map(lineKey));
  for (const line of source.odds) {
    const key = lineKey(line);
    if (seen.has(key)) continue;
    seen.add(key);
    target.odds.push(line);
  }
}

function lineKey(line: OddsLine): string {
  return `${line.bookmaker}:${line.price}:${line.lastUpdate}`;
}

function outcomeName(outcome: Obj, participantName?: string): string {
  const type = str(field(outcome, "type"));
  const modifier = number(field(outcome, "modifier"));
  const modifierText = modifier !== undefined && modifier !== 0 ? ` ${formatModifier(modifier, type)}` : "";

  if (type === "OVER" || type === "UNDER") return `${title(type)}${modifierText}`.trim();
  if (participantName) return `${participantName}${modifierText}`.trim();
  return `${title(type || "Outcome")}${modifierText}`.trim();
}

function opportunityVenue(context: Obj, type: string, value: number | undefined, marketType: string): string {
  const competition = str(field(context, "competitionShortName") ?? field(context, "competitionName"));
  const label = title(type.replace(/_/g, " "));
  const valueText = value !== undefined ? ` ${formatOpportunityValue(value)}` : "";
  return [competition, `${label}${valueText}`, title(marketType.replace(/_/g, " "))].filter(Boolean).join(" - ");
}

function participantNames(context: Obj): Map<string, string> {
  const names = new Map<string, string>();
  for (const raw of array(field(context, "eventParticipants"))) {
    const participant = object(raw);
    const key = str(field(participant, "key"));
    const name = str(field(participant, "name"));
    if (key && name) names.set(key, name);
  }
  return names;
}

function advantages(body: unknown): Obj[] {
  const root = object(body);
  const container = object(field(root, "advantages"));
  const out: Obj[] = [];
  for (const value of Object.values(container)) {
    for (const item of array(value)) {
      const obj = object(item);
      if (Object.keys(obj).length > 0) out.push(obj);
    }
  }
  return out;
}

function isLive(raw: Obj, startTime: string): boolean {
  if (array(field(raw, "outcomes")).some((outcome) => field(object(outcome), "live") === true)) return true;
  const start = Date.parse(startTime);
  return Number.isFinite(start) && start < Date.now();
}

function formatOpportunityValue(value: number): string {
  if (Math.abs(value) < 1) return `${(value * 100).toFixed(1)}%`;
  return value.toFixed(1);
}

function formatModifier(value: number, type = ""): string {
  if (type === "OVER" || type === "UNDER") return String(Math.abs(value));
  return value > 0 ? `+${value}` : String(value);
}

function sportsbookName(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const known: Record<string, string> = {
    bet365: "Bet365",
    betmgm: "BetMGM",
    betparx: "BetPARX",
    betrivers: "BetRivers",
    bovada: "Bovada",
    draftkings: "DraftKings",
    espnbet: "ESPN BET",
    fanduel: "FanDuel",
    fanatics: "Fanatics",
    kutt: "Kutt",
    prophetx: "ProphetX",
  };
  if (known[key]) return known[key];

  return raw
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Sportsbook";
}

function title(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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

function number(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
