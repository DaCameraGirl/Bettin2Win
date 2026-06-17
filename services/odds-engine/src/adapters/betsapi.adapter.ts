import type { SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import type { AdapterResult, SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/**
 * BetsAPI adapter (greyhound racing).
 *
 * Auth: token passed as `?token=` query param.
 * Status: live auth wired + connectivity verified each poll; greyhound card
 * normalization is the next TODO (see README "Provider status").
 */
export class BetsApiAdapter implements SportAdapter {
  readonly provider = "betsapi";
  readonly sport: SportKey = "greyhound";

  hasCredentials(): boolean {
    return env.betsApiKey.length > 0;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents(this.sport), message: "no BETSAPI_KEY" };
    }

    try {
      const url = `https://api.betsapi.com/v1/events/upcoming?sport_id=4339&token=${env.betsApiKey}`;
      const res = await fetch(url);
      const reachable = res.ok;
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: reachable
          ? "live token OK - normalization TODO"
          : `provider ${res.status}`,
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
