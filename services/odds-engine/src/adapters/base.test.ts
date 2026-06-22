import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import { FallbackAdapter, type AdapterResult, type SportAdapter } from "./base.js";

test("fallback prefers backup when primary has live games without odds", async () => {
  const primary = stubAdapter("highlightly", [
    { mode: "live", events: [game("hl-1", [])], message: "11 real baseball matches (odds unavailable)" },
  ]);
  const backup = stubAdapter("espn-mlb-odds", [
    {
      mode: "live",
      events: [game("espn-1", [{ bookmaker: "DraftKings", price: 2.1 }])],
      message: "13/13 MLB games with DraftKings moneyline odds from ESPN",
    },
  ]);

  const adapter = new FallbackAdapter(primary, backup);
  const result = await adapter.fetchEvents();

  assert.equal(result.mode, "live");
  assert.equal(result.events[0]?.id, "espn-1");
  assert.match(result.message ?? "", /espn-mlb-odds/);
  assert.match(result.message ?? "", /no priced events|11 real baseball matches/);
});

test("fallback drops placeholder games when every provider fails", async () => {
  const mockOnly = await new FallbackAdapter(
    {
      sport: "football",
      provider: "primary",
      hasCredentials: () => true,
      fetchEvents: async () => ({
        mode: "mock",
        events: [game("mock-1", [])],
        message: "provider 401",
      }),
    },
    {
      sport: "football",
      provider: "backup",
      hasCredentials: () => true,
      fetchEvents: async () => ({
        mode: "mock",
        events: [game("mock-2", [])],
        message: "provider 429",
      }),
    },
  ).fetchEvents();

  assert.equal(mockOnly.mode, "live");
  assert.equal(mockOnly.events.length, 0);
  assert.match(mockOnly.message ?? "", /provider 401/);
});

test("fallback keeps primary when it already has priced live events", async () => {
  const primary = stubAdapter("the-odds-api", [
    {
      mode: "live",
      events: [game("odds-1", [{ bookmaker: "FanDuel", price: 1.91 }])],
      message: "live odds",
    },
  ]);
  const backup = stubAdapter("espn-mlb-odds", [
    {
      mode: "live",
      events: [game("espn-1", [{ bookmaker: "DraftKings", price: 2.1 }])],
    },
  ]);

  const adapter = new FallbackAdapter(primary, backup);
  const result = await adapter.fetchEvents();

  assert.equal(result.events[0]?.id, "odds-1");
  assert.equal(primary.calls, 1);
  assert.equal(backup.calls, 0);
});

test("fallback uses unpriced primary when backup also lacks odds", async () => {
  const primary = stubAdapter("nhl-scoreboard", [
    { mode: "live", events: [game("nhl-1", [])], message: "1 real NHL scoreboard game (odds unavailable)" },
  ]);
  const backup = stubAdapter("espn-nhl-odds", [
    { mode: "live", events: [game("espn-1", [])], message: "0/1 NHL games with DraftKings moneyline odds from ESPN" },
  ]);

  const adapter = new FallbackAdapter(primary, backup);
  const result = await adapter.fetchEvents();

  assert.equal(result.events[0]?.id, "nhl-1");
});

function stubAdapter(provider: string, responses: AdapterResult[]) {
  const state = { calls: 0 };
  const adapter: SportAdapter & { calls: number } = {
    sport: "baseball",
    provider,
    get calls() {
      return state.calls;
    },
    hasCredentials: () => true,
    fetchEvents: async () => {
      state.calls += 1;
      return responses[state.calls - 1] ?? responses.at(-1)!;
    },
  };
  return adapter;
}

function game(
  id: string,
  odds: Array<{ bookmaker: string; price: number }>,
): SportEvent {
  return {
    id,
    sport: "baseball",
    name: "Away @ Home",
    startTime: "2026-06-22T23:05:00.000Z",
    status: "upcoming",
    source: "test",
    runners: [
      {
        id: `${id}:away`,
        name: "Away",
        odds: odds.map((line) => ({
          bookmaker: line.bookmaker,
          runnerId: `${id}:away`,
          price: line.price,
          impliedProbability: 1 / line.price,
          lastUpdate: "2026-06-22T23:05:00.000Z",
        })),
        bestPrice: odds[0]?.price,
        bestBookmaker: odds[0]?.bookmaker,
      },
      { id: `${id}:home`, name: "Home", odds: [] },
    ],
  };
}