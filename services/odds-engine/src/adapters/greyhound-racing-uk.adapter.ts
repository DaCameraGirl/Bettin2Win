import type { OddsLine, Runner, SportEvent } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/**
 * Greyhound Racing UK (RapidAPI: greyhound-racing-uk.p.rapidapi.com).
 *
 * Mirrors the horse-racing RapidAPI adapter: frugal list + detail caching with a
 * daily budget governor for the free ~50 req/day tier.
 */

const HOST = "greyhound-racing-uk.p.rapidapi.com";
const LIST_TTL_MS = 30 * 60 * 1000;
const DETAIL_PER_CYCLE = 4;
const DAILY_BUDGET = 40;
const MAX_RACES = 40;

interface RawRace {
  id_race: string;
  course: string;
  date: string;
  title: string;
  finished?: string;
  canceled?: string;
}

interface RawDog {
  dog?: string;
  greyhound?: string;
  name?: string;
  id_dog?: string;
  id_greyhound?: string;
  trap?: string;
  number?: string;
  non_runner?: string;
  position?: string;
  sp?: string;
  trainer?: string;
}

interface RawRaceDetail extends RawRace {
  dogs?: RawDog[];
  greyhounds?: RawDog[];
}

const detailCache = new Map<string, { event: SportEvent; finished: boolean }>();
let listCache: RawRace[] = [];
let lastListAt = 0;
let budgetDay = "";
let spentToday = 0;

export class GreyhoundRacingUkAdapter implements SportAdapter {
  readonly provider = "greyhound-racing-uk";
  readonly sport = "greyhound";

  hasCredentials(): boolean {
    return env.rapidApiKey.length > 0;
  }

  private headers() {
    return { "x-rapidapi-key": env.rapidApiKey, "x-rapidapi-host": HOST };
  }

  private trySpend(): boolean {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== budgetDay) {
      budgetDay = today;
      spentToday = 0;
    }
    if (spentToday >= DAILY_BUDGET) return false;
    spentToday += 1;
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents(this.sport), message: "no RAPIDAPI_KEY" };
    }

    try {
      const listStale = Date.now() - lastListAt > LIST_TTL_MS;
      if ((listCache.length === 0 || listStale) && this.trySpend()) {
        const res = await fetch(`https://${HOST}/racecards`, { headers: this.headers() });
        if (res.status === 403) {
          return {
            mode: "mock",
            events: generateMockEvents(this.sport),
            message: "subscribe to Greyhound Racing UK on RapidAPI",
          };
        }
        if (res.ok) {
          const body = (await res.json()) as RawRace[];
          listCache = (Array.isArray(body) ? body : [])
            .filter((race) => race.canceled !== "1")
            .slice(0, MAX_RACES);
          lastListAt = Date.now();
        } else if (listCache.length === 0) {
          return {
            mode: "mock",
            events: generateMockEvents(this.sport),
            message: `list ${res.status}`,
          };
        }
      }

      if (listCache.length === 0) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: "no races / out of daily budget",
        };
      }

      const needsDetail = listCache.filter((race) => !detailCache.has(race.id_race));
      needsDetail.sort((a, b) => Number(b.finished === "1") - Number(a.finished === "1"));
      let fetched = 0;
      for (const race of needsDetail) {
        if (fetched >= DETAIL_PER_CYCLE || !this.trySpend()) break;
        const res = await fetch(`https://${HOST}/race/${race.id_race}`, { headers: this.headers() });
        if (!res.ok) continue;
        const detail = (await res.json()) as RawRaceDetail;
        detailCache.set(race.id_race, {
          event: this.normalize(detail),
          finished: detail.finished === "1",
        });
        fetched += 1;
      }

      const events = listCache.map(
        (race) => detailCache.get(race.id_race)?.event ?? this.placeholder(race),
      );
      const enriched = listCache.filter((race) => detailCache.has(race.id_race)).length;
      return {
        mode: "live",
        events,
        message: `${events.length} races, ${enriched} with trap numbers + results (budget: ${spentToday}/${DAILY_BUDGET} today)`,
      };
    } catch (err) {
      if (detailCache.size > 0 || listCache.length > 0) {
        const events = listCache.map(
          (race) => detailCache.get(race.id_race)?.event ?? this.placeholder(race),
        );
        return { mode: "live", events, message: "served from cache (fetch error)" };
      }
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: err instanceof Error ? err.message : "fetch failed",
      };
    }
  }

  private placeholder(race: RawRace): SportEvent {
    return {
      id: race.id_race,
      sport: this.sport,
      name: `${race.course} - ${race.title}`,
      startTime: new Date(race.date.replace(" ", "T")).toISOString(),
      venue: race.course,
      status: raceStatus(race),
      source: this.provider,
      runners: [],
    };
  }

  private normalize(detail: RawRaceDetail): SportEvent {
    return normalizeGreyhoundRaceDetail(detail, this.provider, this.sport);
  }
}

export function normalizeGreyhoundRaceDetail(
  detail: RawRaceDetail,
  provider: string,
  sport: SportEvent["sport"] = "greyhound",
): SportEvent {
  const dogs = array(detail.dogs ?? detail.greyhounds);
  const runners: Runner[] = dogs
    .filter((dog) => dog.non_runner !== "1")
    .map((dog) => {
      const id = str(dog.id_dog ?? dog.id_greyhound ?? dog.name ?? dog.dog ?? dog.greyhound);
      const name = str(dog.dog ?? dog.greyhound ?? dog.name).trim();
      const trap = dog.trap ?? dog.number;
      const trapNum = trap ? Number.parseInt(trap, 10) : NaN;
      const pos = dog.position ? Number.parseInt(dog.position, 10) : NaN;
      const sp = dog.sp ? Number.parseFloat(dog.sp) : NaN;
      const trainer = str(dog.trainer).trim();
      const odds: OddsLine[] =
        Number.isFinite(sp) && sp > 0
          ? [{
              bookmaker: "SP",
              runnerId: id,
              price: sp,
              impliedProbability: 1 / sp,
              lastUpdate: new Date().toISOString(),
            }]
          : [];

      return {
        id: `${detail.id_race}:${id}`,
        name: trainer ? `Trap ${trap ?? "?"} ${name} (${trainer})` : `Trap ${trap ?? "?"} ${name}`,
        number: Number.isNaN(trapNum) ? undefined : trapNum,
        position: Number.isNaN(pos) ? undefined : pos,
        odds,
      };
    });

  const event: SportEvent = {
    id: detail.id_race,
    sport,
    name: `${detail.course} - ${detail.title}`,
    startTime: new Date(detail.date.replace(" ", "T")).toISOString(),
    venue: detail.course,
    status: raceStatus(detail),
    source: provider,
    runners,
  };
  return decorateRunners(event);
}

function raceStatus(race: RawRace): SportEvent["status"] {
  if (race.finished === "1") return "finished";
  const start = new Date(race.date.replace(" ", "T")).getTime();
  return Number.isFinite(start) && start > Date.now() ? "upcoming" : "live";
}

function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function array(value: unknown): RawDog[] {
  return Array.isArray(value) ? (value as RawDog[]) : [];
}