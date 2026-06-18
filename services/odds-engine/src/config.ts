import type { SportConfig, SportKey } from "@bettin2win/types";

/**
 * Per-sport configuration. Poll intervals match what each provider's free tier
 * realistically allows (racing feeds update faster than sportsbook lines).
 */
export const SPORTS: Record<SportKey, SportConfig> = {
  football: {
    key: "football",
    label: "Football",
    provider: "the-odds-api+sportsbook-api+highlightly-matches",
    pollIntervalMs: 15_000,
  },
  baseball: {
    key: "baseball",
    label: "Baseball",
    provider: "the-odds-api+tank01-mlb+highlightly-matches+mlb-stats",
    pollIntervalMs: 15_000,
  },
  basketball: {
    key: "basketball",
    label: "Basketball",
    provider: "the-odds-api+sportsbook-api+highlightly-matches",
    pollIntervalMs: 15_000,
  },
  hockey: {
    key: "hockey",
    label: "Hockey",
    provider: "the-odds-api+sportsbook-api+highlightly-matches",
    pollIntervalMs: 15_000,
  },
  soccer: {
    key: "soccer",
    label: "Soccer",
    provider: "betminer+football-prediction-api",
    // BetMiner returns the whole daily board in one request, so poll gently
    // while still refreshing live score/minute changes.
    pollIntervalMs: 180_000,
  },
  golf: {
    key: "golf",
    label: "Golf",
    provider: "espn-golf",
    pollIntervalMs: 60_000,
  },
  nascar: {
    key: "nascar",
    label: "NASCAR",
    provider: "therundown",
    pollIntervalMs: 10_000,
  },
  "horse-racing": {
    key: "horse-racing",
    label: "Horse Racing",
    provider: "horse-racing-rapidapi+racing-api",
    // RapidAPI horse feed is capped at ~50 req/day; the adapter caches hard and
    // governs its own budget, so the poller can tick gently.
    pollIntervalMs: 120_000,
  },
  greyhound: {
    key: "greyhound",
    label: "Greyhound",
    provider: "betsapi",
    pollIntervalMs: 5_000,
  },
};

export const env = {
  oddsApiKey: process.env.ODDS_API_KEY ?? "",
  theRundownKey: process.env.THERUNDOWN_API_KEY ?? "",
  racingApiUsername: process.env.RACING_API_USERNAME ?? "",
  racingApiPassword: process.env.RACING_API_PASSWORD ?? "",
  betsApiKey: process.env.BETSAPI_KEY ?? "",
  highlightlyKey: process.env.HIGHLIGHTLY_API_KEY ?? "",
  // Shared RapidAPI key for prediction + fallback providers such as
  // football-prediction-api and Tank01 MLB.
  rapidApiKey: process.env.RAPIDAPI_KEY ?? "",
  // Hosts like Render inject PORT; fall back to our local default otherwise.
  port: Number(process.env.PORT ?? process.env.ODDS_ENGINE_PORT ?? 4000),
};

export const ALL_SPORTS: SportKey[] = Object.keys(SPORTS) as SportKey[];
