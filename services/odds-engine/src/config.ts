import type { SportConfig, SportKey } from "@bettin2win/types";

/**
 * Per-sport configuration. Poll intervals match what each provider's free tier
 * realistically allows (racing feeds update faster than sportsbook lines).
 */
export const SPORTS: Record<SportKey, SportConfig> = {
  football: {
    key: "football",
    label: "Football",
    provider: "the-odds-api",
    pollIntervalMs: 15_000,
  },
  baseball: {
    key: "baseball",
    label: "Baseball",
    provider: "the-odds-api",
    pollIntervalMs: 15_000,
  },
  soccer: {
    key: "soccer",
    label: "Soccer",
    provider: "football-prediction-api",
    // Predictions barely move and the free RapidAPI tier is rate-limited, so
    // poll gently — a slow sweep across federations, not a tight loop.
    pollIntervalMs: 90_000,
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
    provider: "racing-api",
    pollIntervalMs: 5_000,
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
  // Shared RapidAPI key for the prediction providers (football-prediction-api,
  // and future basketball/other prediction tabs on the same RapidAPI account).
  rapidApiKey: process.env.RAPIDAPI_KEY ?? "",
  // Hosts like Render inject PORT; fall back to our local default otherwise.
  port: Number(process.env.PORT ?? process.env.ODDS_ENGINE_PORT ?? 4000),
};

export const ALL_SPORTS: SportKey[] = Object.keys(SPORTS) as SportKey[];
