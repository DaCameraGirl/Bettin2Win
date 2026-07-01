import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SportEvent } from "@bettin2win/types";
import { dataSourceLabel, isSampleEvent } from "./dataSourceLabel.js";

describe("dataSourceLabel", () => {
  it("maps known provider keys to friendly names", () => {
    assert.equal(dataSourceLabel("the-odds-api"), "The Odds API");
    assert.equal(dataSourceLabel("espn-nhl-odds"), "ESPN");
    assert.equal(dataSourceLabel("betminer"), "BetMiner");
  });

  it("formats unknown provider keys readably", () => {
    assert.equal(dataSourceLabel("some-new-feed"), "Some New Feed");
  });

  it("detects sample events from source or id", () => {
    const sample: SportEvent = {
      id: "demo-football-0",
      sport: "football",
      name: "Chiefs @ Eagles",
      startTime: new Date().toISOString(),
      status: "upcoming",
      source: "demo",
      runners: [],
    };
    const live: SportEvent = {
      ...sample,
      id: "abc123",
      source: "the-odds-api",
    };

    assert.equal(isSampleEvent(sample), true);
    assert.equal(isSampleEvent(live), false);
  });
});