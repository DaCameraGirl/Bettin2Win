import type { Runner, SportEvent, SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/**
 * The Racing API adapter (horse racing).
 *
 * Auth: HTTP Basic Auth with username + password (NOT a single bearer key).
 * This corrected the scaffold's original assumption of a single RACING_API_KEY.
 *
 * Endpoint: GET /v1/racecards/free returns today's GB racecards with full
 * field detail (course, off time, horse, jockey, trainer, draw, form...).
 *
 * Prices: the FREE racecards endpoint does NOT include live odds - runners have
 * no price/SP field. We therefore surface real races and real runners with an
 * empty odds array (UI shows "-" for price). Live prices require a paid plan /
 * odds endpoint; wire that in by populating `runner.odds` here.
 */

interface RawRunner {
  horse: string;
  horse_id: string;
  number?: string;
  draw?: string;
  jockey?: string;
  trainer?: string;
}

interface RawRacecard {
  race_id: string;
  course: string;
  off_time: string;
  off_dt: string; // ISO 8601 with timezone
  race_name: string;
  region?: string;
  race_status?: string;
  runners: RawRunner[];
}

interface RacecardsResponse {
  racecards: RawRacecard[];
}

export class RacingApiAdapter implements SportAdapter {
  readonly provider = "racing-api";
  readonly sport: SportKey = "horse-racing";

  hasCredentials(): boolean {
    return env.racingApiUsername.length > 0 && env.racingApiPassword.length > 0;
  }

  private authHeader(): string {
    const token = Buffer.from(
      `${env.racingApiUsername}:${env.racingApiPassword}`,
    ).toString("base64");
    return `Basic ${token}`;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: "no RACING_API_USERNAME / RACING_API_PASSWORD",
      };
    }

    try {
      const res = await fetch("https://api.theracingapi.com/v1/racecards/free", {
        headers: { Authorization: this.authHeader() },
      });
      if (!res.ok) {
        return {
          mode: "mock",
          events: generateMockEvents(this.sport),
          message: `provider ${res.status}`,
        };
      }
      const body = (await res.json()) as RacecardsResponse;
      const cards = body.racecards ?? [];
      return {
        mode: "live",
        events: cards.map((c) => this.normalize(c)),
        message: "racecards live (free tier: no prices)",
      };
    } catch (err) {
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: err instanceof Error ? err.message : "fetch failed",
      };
    }
  }

  private normalize(card: RawRacecard): SportEvent {
    const start = new Date(card.off_dt).getTime();
    const status = Number.isFinite(start) && start > Date.now() ? "upcoming" : "live";

    const runners: Runner[] = card.runners.map((r) => {
      const num = r.number ? Number.parseInt(r.number, 10) : NaN;
      const detail = [r.jockey, r.trainer].filter(Boolean).join(" / ");
      return {
        id: `${card.race_id}:${r.horse_id}`,
        name: detail ? `${r.horse} (${detail})` : r.horse,
        number: Number.isNaN(num) ? undefined : num,
        odds: [], // free tier returns no prices
      };
    });

    const event: SportEvent = {
      id: card.race_id,
      sport: this.sport,
      name: `${card.course} ${card.off_time} - ${card.race_name}`,
      startTime: card.off_dt,
      venue: card.course,
      status,
      source: this.provider,
      runners,
    };
    return decorateRunners(event);
  }
}
