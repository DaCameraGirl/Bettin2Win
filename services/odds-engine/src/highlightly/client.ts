import { env } from "../config.js";
import { normalizeStandings } from "./normalize.js";
import {
  HIGHLIGHTLY_HOST,
  STANDINGS,
  type EnrichSport,
  type TeamStanding,
} from "./types.js";

export class HighlightlyError extends Error {}

/**
 * Client for the Highlightly sports-data API (via RapidAPI).
 *
 * Enrichment only: the Basic plan exposes teams / standings / fixtures / form
 * but NOT odds ("Odds are not available in Basic plan"). So this powers context
 * cards, not prices. Auth uses the two RapidAPI headers.
 */
export class HighlightlyClient {
  hasCredentials(): boolean {
    return env.highlightlyKey.length > 0;
  }

  private headers(): Record<string, string> {
    return {
      "x-rapidapi-host": HIGHLIGHTLY_HOST,
      "x-rapidapi-key": env.highlightlyKey,
    };
  }

  async getStandings(sport: EnrichSport, season: number): Promise<TeamStanding[]> {
    if (!this.hasCredentials()) {
      throw new HighlightlyError("no HIGHLIGHTLY_API_KEY");
    }
    const spec = STANDINGS[sport];
    const qs = new URLSearchParams(spec.query(season)).toString();
    const url = `https://${HIGHLIGHTLY_HOST}/${spec.sportPath}/standings?${qs}`;

    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      throw new HighlightlyError(`provider ${res.status}`);
    }
    return normalizeStandings(await res.json());
  }
}

export const highlightly = new HighlightlyClient();
