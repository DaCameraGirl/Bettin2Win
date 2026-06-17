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
  port: Number(process.env.ODDS_ENGINE_PORT ?? 4000),
};

export const ALL_SPORTS: SportKey[] = Object.keys(SPORTS) as SportKey[];
