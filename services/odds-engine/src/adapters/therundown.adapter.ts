import type { SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import type { AdapterResult, SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/**
 * TheRundown adapter (NASCAR / motorsport).
 *
 * Auth: API key sent in the `X-TheRundown-Key` header.
 * Status: live auth is wired and connectivity is verified on each poll, but
 * TheRundown's motorsport payload still needs field-level normalization, so we
 * surface mock events tagged with the live connection status until that mapping
 * lands. See README "Provider status" for the TODO checklist.
 */
export class TheRundownAdapter implements SportAdapter {
  readonly provider = "therundown";
  readonly sport: SportKey = "nascar";

  hasCredentials(): boolean {
    return env.theRundownKey.length > 0;
  }

  async fetchEvents(): Promise<AdapterResult> {
    if (!this.hasCredentials()) {
      return { mode: "mock", events: generateMockEvents(this.sport), message: "no THERUNDOWN_API_KEY" };
    }

    try {
      const res = await fetch("https://therundown.io/api/v2/sports", {
        headers: { "X-TheRundown-Key": env.theRundownKey },
      });
      const reachable = res.ok;
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: reachable
          ? "live key OK - normalization TODO"
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
