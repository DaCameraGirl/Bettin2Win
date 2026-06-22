import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProviderHealth, SportEvent } from "@bettin2win/types";
import {
  activeFeedNote,
  classifyFeedStatus,
  developerStatusDetail,
  feedSummaryFromHealth,
  userStatusDetail,
} from "./providerStatus";

const mockFootballEvent: SportEvent = {
  id: "mock-football-0",
  sport: "football",
  name: "Chiefs @ Eagles",
  startTime: new Date().toISOString(),
  status: "live",
  source: "mock",
  runners: [
    { id: "mock-football-0-r0", name: "Away", odds: [] },
    { id: "mock-football-0-r1", name: "Home", odds: [] },
  ],
};

const realFootballEvent: SportEvent = {
  id: "espn-nfl:401547456",
  sport: "football",
  name: "Chiefs @ Eagles",
  startTime: new Date().toISOString(),
  status: "upcoming",
  source: "espn-nfl",
  runners: [
    { id: "espn-nfl:401547456:away", name: "Chiefs", odds: [] },
    { id: "espn-nfl:401547456:home", name: "Eagles", odds: [] },
  ],
};

const pricedFootballEvent: SportEvent = {
  ...realFootballEvent,
  id: "espn-nfl-odds:401872656",
  source: "espn-nfl-odds",
  runners: [
    {
      id: "espn-nfl-odds:401872656:away",
      name: "Patriots",
      odds: [{ bookmaker: "DraftKings", runnerId: "x", price: 2.7, impliedProbability: 0, lastUpdate: "" }],
      bestPrice: 2.7,
      bestBookmaker: "DraftKings",
    },
    {
      id: "espn-nfl-odds:401872656:home",
      name: "Seahawks",
      odds: [{ bookmaker: "DraftKings", runnerId: "y", price: 1.49, impliedProbability: 0, lastUpdate: "" }],
      bestPrice: 1.49,
      bestBookmaker: "DraftKings",
    },
  ],
};

describe("activeFeedNote", () => {
  it("returns the final backup clause", () => {
    const message =
      "the-odds-api unavailable (provider 401); backup sportsbook-api - no opps; backup espn-nfl-odds - 16/16 NFL games with DraftKings moneyline odds from ESPN";
    assert.equal(
      activeFeedNote(message),
      "16/16 NFL games with DraftKings moneyline odds from ESPN",
    );
  });
});

describe("classifyFeedStatus", () => {
  it("labels provider quota errors instead of demo for mock fallback boards", () => {
    const health: ProviderHealth = {
      sport: "football",
      provider: "the-odds-api+sportsbook-api+highlightly-matches",
      mode: "mock",
      ok: false,
      lastChecked: new Date().toISOString(),
      message: "provider 401; backup highlightly-matches: provider 429",
    };

    assert.equal(classifyFeedStatus(health, [mockFootballEvent]), "quota-hit");
  });

  it("shows real game feed for live ESPN boards without odds", () => {
    const health: ProviderHealth = {
      sport: "football",
      provider: "espn-nfl",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message: "2 real NFL games from ESPN (odds unavailable)",
    };

    assert.equal(classifyFeedStatus(health, [realFootballEvent]), "real-game-feed");
  });

  it("keeps intentional demo mode yellow only when forced", () => {
    assert.equal(classifyFeedStatus(undefined, [mockFootballEvent], true), "demo");
  });

  it("shows real game feed even when health message mentions quota errors", () => {
    const health: ProviderHealth = {
      sport: "hockey",
      provider: "espn-nhl-odds+nhl-scoreboard",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "the-odds-api unavailable (provider 401); backup highlightly-matches: provider 429); backup espn-nhl-odds+nhl-scoreboard - 1 real NHL game (odds unavailable)",
    };

    assert.equal(classifyFeedStatus(health, [realFootballEvent]), "real-game-feed");
  });

  it("shows live odds from health when backup succeeded before websocket snapshot", () => {
    const health: ProviderHealth = {
      sport: "football",
      provider: "the-odds-api+sportsbook-api+espn-nfl-odds",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "the-odds-api+sportsbook-api unavailable (the-odds-api unavailable (provider 401); backup sportsbook-api - sportsbook-api returned no opportunities for this sport); backup espn-nfl-odds - 16/16 NFL games with DraftKings moneyline odds from ESPN",
    };

    assert.equal(classifyFeedStatus(health, []), "live-odds");
  });

  it("shows live odds for basketball when sportsbook backup succeeded", () => {
    const health: ProviderHealth = {
      sport: "basketball",
      provider: "the-odds-api+sportsbook-api",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "the-odds-api unavailable (provider 401); backup sportsbook-api - 12 real basketball sportsbook opportunities",
    };

    assert.equal(classifyFeedStatus(health, []), "live-odds");
  });

  it("shows live odds for baseball when ESPN backup succeeded", () => {
    const health: ProviderHealth = {
      sport: "baseball",
      provider: "the-odds-api+tank01-mlb+highlightly-matches+espn-mlb-odds+mlb-stats",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "the-odds-api+tank01-mlb+highlightly-matches unavailable (provider 401; backup tank01-mlb - provider 429); backup espn-mlb-odds+mlb-stats - 13/13 MLB games with DraftKings moneyline odds from ESPN",
    };

    assert.equal(classifyFeedStatus(health, []), "live-odds");
  });

  it("shows real game feed for horse racing racecards backup", () => {
    const health: ProviderHealth = {
      sport: "horse-racing",
      provider: "horse-racing-rapidapi+racing-api",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "horse-racing-rapidapi unavailable (list 429); backup racing-api - racecards live (free tier: no prices)",
    };

    assert.equal(classifyFeedStatus(health, []), "real-game-feed");
  });

  it("still shows no key when every backup failed", () => {
    const health: ProviderHealth = {
      sport: "greyhound",
      provider: "greyhound-racing-uk+betsapi",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "greyhound-racing-uk unavailable (subscribe to Greyhound Racing UK on RapidAPI); backup betsapi - no BETSAPI_KEY",
    };

    assert.equal(classifyFeedStatus(health, []), "no-key");
  });

  it("prefers priced websocket events over health noise", () => {
    const health: ProviderHealth = {
      sport: "football",
      provider: "the-odds-api+sportsbook-api+espn-nfl-odds",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message: "the-odds-api unavailable (provider 401)",
    };

    assert.equal(classifyFeedStatus(health, [pricedFootballEvent]), "live-odds");
  });
});

describe("userStatusDetail", () => {
  it("uses plain language for live odds without HTTP codes", () => {
    const health: ProviderHealth = {
      sport: "football",
      provider: "espn-nfl-odds",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "backup espn-nfl-odds - 16/16 NFL games with DraftKings moneyline odds from ESPN",
    };

    assert.equal(
      userStatusDetail("live-odds", health, 16),
      "Betting lines from our backup sports feed",
    );
  });

  it("hides provider 401 jargon from beginners", () => {
    const health: ProviderHealth = {
      sport: "basketball",
      provider: "the-odds-api",
      mode: "mock",
      ok: false,
      lastChecked: new Date().toISOString(),
      message: "provider 401; backup highlightly-matches: provider 429",
    };

    assert.equal(
      userStatusDetail("quota-hit", health, 0),
      "Primary feed busy — showing backup data when available",
    );
    assert.match(developerStatusDetail(health) ?? "", /401/);
  });
});

describe("feedSummaryFromHealth", () => {
  it("surfaces the active backup note instead of the error chain", () => {
    const health: ProviderHealth = {
      sport: "baseball",
      provider: "espn-mlb-odds",
      mode: "live",
      ok: true,
      lastChecked: new Date().toISOString(),
      message:
        "primary failed; backup espn-mlb-odds+mlb-stats - 13/13 MLB games with DraftKings moneyline odds from ESPN",
    };

    assert.equal(
      feedSummaryFromHealth(health, 0),
      "13/13 MLB games with DraftKings moneyline odds from ESPN",
    );
  });
});