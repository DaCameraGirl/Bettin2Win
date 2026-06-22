import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProviderHealth, SportEvent } from "@bettin2win/types";
import { classifyFeedStatus } from "./providerStatus";

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

  it("keeps intentional demo mode yellow", () => {
    assert.equal(classifyFeedStatus(undefined, [mockFootballEvent], true), "demo");
  });
});