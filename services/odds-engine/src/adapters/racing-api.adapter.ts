import type { SportKey } from "@bettin2win/types";
import { env } from "../config.js";
import type { AdapterResult, SportAdapter } from "./base.js";
import { generateMockEvents } from "./mock.js";

/**
 * The Racing API adapter (horse racing).
 *
 * Auth: HTTP Basic Auth with username + password (NOT a single bearer key).
 * This was the scaffold's original mistake - the env contract is
 * RACING_API_USERNAME + RACING_API_PASSWORD.
 *
 * Status: live auth wired + connectivity verified each poll; racecard -> runner
 * normalization is the next TODO (see README "Provider status").
 */
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
      const reachable = res.ok;
      return {
        mode: "mock",
        events: generateMockEvents(this.sport),
        message: reachable
          ? "live auth OK - normalization TODO"
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
