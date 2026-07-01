import type { Runner, SportEvent } from "@bettin2win/types";
import { decorateRunners } from "./base.js";

export function mergeSoccerEvents(primary: SportEvent[], priced: SportEvent[]): SportEvent[] {
  const pricedByKey = new Map<string, SportEvent>();
  for (const event of priced) {
    const key = matchupKey(event.name);
    if (key) pricedByKey.set(key, event);
  }

  const merged: SportEvent[] = [];
  const used = new Set<string>();

  for (const event of primary) {
    const key = matchupKey(event.name);
    const oddsFeed = key ? pricedByKey.get(key) : undefined;
    if (key) used.add(key);
    merged.push(oddsFeed ? mergePair(event, oddsFeed) : event);
  }

  for (const [key, event] of pricedByKey) {
    if (!used.has(key)) merged.push(event);
  }

  return merged.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

function mergePair(primary: SportEvent, priced: SportEvent): SportEvent {
  const runners = primary.runners.map((runner) => {
    const pricedRunner = findRunner(priced.runners, runner.name);
    if (!pricedRunner || !hasPrices(pricedRunner)) return runner;
    return {
      ...runner,
      odds: pricedRunner.odds,
      bestPrice: pricedRunner.bestPrice,
      bestBookmaker: pricedRunner.bestBookmaker,
    };
  });

  return decorateRunners({
    ...primary,
    runners,
    status: primary.status === "upcoming" ? priced.status : primary.status,
    score: primary.score ?? priced.score,
    clock: primary.clock ?? priced.clock,
    awayLogo: primary.awayLogo ?? priced.awayLogo,
    homeLogo: primary.homeLogo ?? priced.homeLogo,
    source: eventHasPrices(priced) ? `${primary.source}+${priced.source}` : primary.source,
  });
}

function findRunner(runners: Runner[], name: string): Runner | undefined {
  const target = name.trim().toLowerCase();
  return runners.find((runner) => {
    const candidate = runner.name.trim().toLowerCase();
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
}

function hasPrices(runner: Runner): boolean {
  return runner.odds.length > 0 || runner.bestPrice !== undefined;
}

function eventHasPrices(event: SportEvent): boolean {
  return event.runners.some((runner) => hasPrices(runner));
}

export function matchupKey(name: string): string | null {
  const sides = name.split(" @ ").map((side) => normalizeTeam(side));
  if (sides.length !== 2 || !sides[0] || !sides[1]) return null;
  return `${sides[0]}@${sides[1]}`;
}

function normalizeTeam(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(fc|sc|afc|cf|united|city)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}