import type { OddsLine, Runner, SportEvent, SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/**
 * Horse Racing (RapidAPI: horse-racing.p.rapidapi.com) — UK & Ireland.
 *
 * Unlike The Racing API's free racecards (lineup only, no prices), this feed
 * exposes REAL finishing positions and REAL starting-price odds per horse via
 * GET /race/{id_race}. The catch: the free RapidAPI plan allows only
 * ~50 requests/day. A live dashboard polling every few minutes would blow that
 * instantly, so this adapter is deliberately frugal:
 *
 *  - The race LIST (`GET /racecards`) is refreshed at most every LIST_TTL_MS.
 *  - Per-race detail (`GET /race/{id}`) is fetched at most DETAIL_PER_CYCLE per
 *    poll, prioritising finished races (which carry positions + final SPs).
 *  - Finished/cancelled races are immutable, so their detail is cached forever;
 *    we never spend a request on them twice.
 *  - A hard DAILY_BUDGET governor (well under the real 50) guarantees we never
 *    exhaust the quota; once spent, we serve cache and let the FallbackAdapter
 *    drop back to The Racing API's free racecards.
 */

const HOST = "horse-racing.p.rapidapi.com";
const LIST_TTL_MS = 30 * 60 * 1000; // refresh the day's race list at most every 30 min
const DETAIL_PER_CYCLE = 4; // new /race/{id} calls per poll
const DAILY_BUDGET = 40; // hard cap (real free limit is 50); leaves headroom
const MAX_RACES = 40; // safety cap on races surfaced per day

interface RawRace {
  id_race: string;
  course: string;
  date: string; // "2026-06-18 14:30:00" (UK local)
  title: string;
  distance?: string;
  going?: string;
  finished?: string; // "1" once decided
  canceled?: string; // "1" if abandoned
  finish_time?: string;
}

interface RawHorse {
  horse: string;
  id_horse: string;
  jockey?: string;
  trainer?: string;
  number?: string;
  non_runner?: string; // "1" if scratched
  form?: string;
  position?: string; // finishing position once decided
  sp?: string; // starting price (decimal), e.g. "6.5"
}

interface RawRaceDetail extends RawRace {
  horses: RawHorse[];
}

/** Module-level caches survive across polls for the life of the process. */
const detailCache = new Map<string, { event: SportEvent; finished: boolean }>();
let listCache: RawRace[] = [];
let lastListAt = 0;
let budgetDay = "";
let spentToday = 0;

export class HorseRacingRapidApiAdapter implements SportAdapter {
  readonly provider = "horse-racing-rapidapi";
  readonly sport: SportKey = "horse-racing";

  hasCredentials(): boolean {
    return env.rapidApiKey.length > 0;
  }

  private headers() {
    return { "x-rapidapi-key": env.rapidApiKey, "x-rapidapi-host": HOST };
  }

  /** Spend one request against the daily governor; false when out of budget. */
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
      // 1) Refresh the day's race list, throttled by TTL + budget.
      const listStale = Date.now() - lastListAt > LIST_TTL_MS;
      if ((listCache.length === 0 || listStale) && this.trySpend()) {
        const res = await fetch(`https://${HOST}/racecards`, { headers: this.headers() });
        if (res.ok) {
          const body = (await res.json()) as RawRace[];
          listCache = (Array.isArray(body) ? body : [])
            .filter((r) => r.canceled !== "1")
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

      // 2) Enrich a few races with real positions + odds, prioritising finished
      //    races we haven't cached yet, then upcoming ones for the lineup.
      const needsDetail = listCache.filter((r) => !detailCache.has(r.id_race));
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

      // 3) Build the response: detailed events where we have them, a lightweight
      //    lineup-less placeholder otherwise (so the race still shows up).
      const events = listCache.map(
        (race) => detailCache.get(race.id_race)?.event ?? this.placeholder(race),
      );
      const enriched = listCache.filter((r) => detailCache.has(r.id_race)).length;
      return {
        mode: "live",
        events,
        message: `${events.length} races, ${enriched} with real positions + odds (free 50/day budget: ${spentToday} used today)`,
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

  private status(race: RawRace): SportEvent["status"] {
    if (race.finished === "1") return "finished";
    const start = new Date(race.date.replace(" ", "T")).getTime();
    return Number.isFinite(start) && start > Date.now() ? "upcoming" : "live";
  }

  /** A race we know about from the list but haven't paid to detail yet. */
  private placeholder(race: RawRace): SportEvent {
    return {
      id: race.id_race,
      sport: this.sport,
      name: `${race.course} - ${race.title}`,
      startTime: new Date(race.date.replace(" ", "T")).toISOString(),
      venue: race.course,
      status: this.status(race),
      source: this.provider,
      runners: [],
    };
  }

  private normalize(detail: RawRaceDetail): SportEvent {
    const runners: Runner[] = detail.horses
      .filter((h) => h.non_runner !== "1")
      .map((h) => {
        const num = h.number ? Number.parseInt(h.number, 10) : NaN;
        const pos = h.position ? Number.parseInt(h.position, 10) : NaN;
        const sp = h.sp ? Number.parseFloat(h.sp) : NaN;
        const who = [h.jockey, h.trainer].filter(Boolean).join(" / ");
        const odds: OddsLine[] =
          Number.isFinite(sp) && sp > 0
            ? [
                {
                  bookmaker: "SP",
                  runnerId: h.id_horse,
                  price: sp,
                  impliedProbability: 1 / sp,
                  lastUpdate: new Date().toISOString(),
                },
              ]
            : [];
        return {
          id: `${detail.id_race}:${h.id_horse}`,
          name: who ? `${h.horse} (${who})` : h.horse,
          number: Number.isNaN(num) ? undefined : num,
          position: Number.isNaN(pos) ? undefined : pos,
          odds,
        };
      });

    const event: SportEvent = {
      id: detail.id_race,
      sport: this.sport,
      name: `${detail.course} - ${detail.title}`,
      startTime: new Date(detail.date.replace(" ", "T")).toISOString(),
      venue: detail.course,
      status: this.status(detail),
      source: this.provider,
      runners,
    };
    return decorateRunners(event);
  }
}
