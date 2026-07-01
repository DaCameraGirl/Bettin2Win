import type { OddsLine, Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners } from "./base.js";

type Obj = Record<string, unknown>;

export interface EspnSummaryTarget {
  sportPath: string;
  leagueCode: string;
  eventId: string;
}

/** Fetch ESPN game summary and attach moneyline odds when the scoreboard omitted them. */
export async function enrichEspnEventsFromSummary(
  events: SportEvent[],
  targets: EspnSummaryTarget[],
  maxFetches = 8,
): Promise<SportEvent[]> {
  const byId = new Map(events.map((event) => [eventIdFromEspnEvent(event), event]));
  let fetches = 0;

  for (const target of targets) {
    if (fetches >= maxFetches) break;
    const event = byId.get(target.eventId);
    if (!event || eventHasOdds(event)) continue;

    fetches += 1;
    const summary = await fetchEspnSummary(target.sportPath, target.leagueCode, target.eventId);
    if (!summary) continue;

    const enriched = applySummaryMoneyline(event, summary);
    if (eventHasOdds(enriched)) byId.set(target.eventId, enriched);
    await sleep(120);
  }

  return events.map((event) => byId.get(eventIdFromEspnEvent(event)) ?? event);
}

export async function fetchEspnSummary(
  sportPath: string,
  leagueCode: string,
  eventId: string,
): Promise<unknown | null> {
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/${leagueCode}/summary?event=${eventId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function applySummaryMoneyline(event: SportEvent, summary: unknown): SportEvent {
  const odds = extractSummaryOdds(summary);
  if (!odds) return event;

  const { bookmaker, away, home, draw } = odds;
  const eventId = eventIdFromEspnEvent(event);
  const runners = event.runners.map((runner) => {
    const side = runnerSide(runner.name, event);
    const price = side === "away" ? away : side === "home" ? home : side === "draw" ? draw : undefined;
    if (!price) return runner;
    return attachPrice(runner, eventId, side ?? "away", price, bookmaker, event.startTime);
  });

  return decorateRunners({ ...event, runners });
}

export function extractSummaryOdds(
  summary: unknown,
): { bookmaker: string; away?: number; home?: number; draw?: number } | null {
  const pickcenter = array(field(object(summary), "pickcenter"));
  const oddsBlock = pickcenter.length > 0 ? object(pickcenter[0]) : object(field(object(summary), "odds"));
  if (Object.keys(oddsBlock).length === 0) return null;

  const moneyline = object(field(oddsBlock, "moneyline"));
  const provider = object(field(oddsBlock, "provider"));
  const bookmaker = str(field(provider, "displayName") ?? field(provider, "name")).trim() || "ESPN";

  const awayClose = object(field(object(field(moneyline, "away")), "close"));
  const homeClose = object(field(object(field(moneyline, "home")), "close"));
  const drawClose = object(field(object(field(moneyline, "draw")), "close"));
  const drawOdds = object(field(oddsBlock, "drawOdds"));

  const away = decimalFromAmerican(awayClose, "odds") ?? decimalFromAmerican(awayClose, "line");
  const home = decimalFromAmerican(homeClose, "odds") ?? decimalFromAmerican(homeClose, "line");
  const draw = decimalFromAmerican(drawClose, "odds") ?? decimalFromAmerican(drawOdds, "moneyLine");

  if (away === undefined && home === undefined && draw === undefined) return null;
  return { bookmaker, away, home, draw };
}

function attachPrice(
  runner: Runner,
  eventId: string,
  side: "away" | "home" | "draw",
  price: number,
  bookmaker: string,
  lastUpdate: string,
): Runner {
  const runnerId = `${runner.id}:${side}-summary`;
  const odds: OddsLine[] = [{
    bookmaker,
    runnerId,
    price,
    impliedProbability: 0,
    lastUpdate,
  }];
  return { ...runner, odds, bestPrice: price, bestBookmaker: bookmaker };
}

function runnerSide(name: string, event: SportEvent): "away" | "home" | "draw" | null {
  if (name.toLowerCase() === "draw") return "draw";
  const sides = event.name.split(" @ ").map((part) => part.trim().toLowerCase());
  const normalized = name.trim().toLowerCase();
  if (sides[0] && (normalized === sides[0] || normalized.includes(sides[0]) || sides[0].includes(normalized))) {
    return "away";
  }
  if (sides[1] && (normalized === sides[1] || normalized.includes(sides[1]) || sides[1].includes(normalized))) {
    return "home";
  }
  return null;
}

export function eventIdFromEspnEvent(event: SportEvent): string {
  const parts = event.id.split(":");
  return parts[parts.length - 1] ?? event.id;
}

function eventHasOdds(event: SportEvent): boolean {
  return event.runners.some((runner) => runner.odds.length > 0 || runner.bestPrice !== undefined);
}

function decimalFromAmerican(parent: Obj, key: string): number | undefined {
  const text = str(field(parent, key)).replace(/[^0-9+-]/g, "");
  if (!text || text === "+0" || text === "-0" || text === "0") return undefined;
  const american = Number(text);
  if (!Number.isFinite(american) || american === 0) return undefined;
  const decimal = american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
  return Number(decimal.toFixed(3));
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