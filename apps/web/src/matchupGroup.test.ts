import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SportEvent } from "@bettin2win/types";
import {
  basketballMarketSection,
  basketballMatchupKey,
  groupBasketballMatchups,
  movementsForMatchup,
} from "./matchupGroup";

const baseEvent = (overrides: Partial<SportEvent>): SportEvent => ({
  id: "demo-1",
  sport: "basketball",
  name: "Toronto Tempo @ Atlanta Dream",
  startTime: "2026-06-22T23:00:00.000Z",
  status: "upcoming",
  source: "test",
  runners: [],
  ...overrides,
});

describe("matchupGroup", () => {
  it("groups sportsbook basketball markets under one matchup key", () => {
    const moneyline = baseEvent({
      id: "sportsbook-api:event-1:ARBITRAGE:MONEYLINE:",
      name: "Toronto Tempo @ Atlanta Dream",
      runners: [{ id: "a", name: "Toronto Tempo", odds: [] }, { id: "b", name: "Atlanta Dream", odds: [] }],
    });
    const spread = baseEvent({
      id: "sportsbook-api:event-1:ARBITRAGE:POINT_SPREAD:",
      venue: "WNBA - Arbitrage 9.7% - Point Spread",
      runners: [{ id: "a", name: "Toronto Tempo -1.5", odds: [] }, { id: "b", name: "Atlanta Dream +1.5", odds: [] }],
    });
    const total = baseEvent({
      id: "sportsbook-api:event-1:ARBITRAGE:TOTAL:",
      runners: [{ id: "o", name: "Over 164.5", odds: [] }, { id: "u", name: "Under 164.5", odds: [] }],
    });

    const groups = groupBasketballMatchups([spread, total, moneyline]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.name, "Toronto Tempo @ Atlanta Dream");
    assert.equal(groups[0]?.sections.moneyline.length, 1);
    assert.equal(groups[0]?.sections.spread.length, 1);
    assert.equal(groups[0]?.sections.total.length, 1);
  });

  it("classifies market sections from sportsbook ids and runner labels", () => {
    assert.equal(
      basketballMarketSection(baseEvent({ id: "sportsbook-api:abc:ARBITRAGE:POINT_SPREAD:" })),
      "spread",
    );
    assert.equal(
      basketballMarketSection(baseEvent({ id: "sportsbook-api:abc:ARBITRAGE:TOTAL:" })),
      "total",
    );
    assert.equal(
      basketballMarketSection(baseEvent({
        id: "espn-nba-odds:401",
        runners: [{ id: "a", name: "Lakers", odds: [] }, { id: "b", name: "Celtics", odds: [] }],
      })),
      "moneyline",
    );
  });

  it("falls back to normalized matchup names when ids differ", () => {
    const espn = baseEvent({ id: "espn-nba-odds:401", name: "Toronto Tempo @ Atlanta Dream" });
    const sportsbook = baseEvent({
      id: "sportsbook-api:event-9:ARBITRAGE:POINT_SPREAD:",
      name: "toronto tempo @ atlanta dream",
    });

    assert.equal(basketballMatchupKey(espn), "matchup:toronto tempo @ atlanta dream");
    assert.equal(groupBasketballMatchups([espn, sportsbook]).length, 1);
  });

  it("filters movements to the grouped matchup event ids", () => {
    const groups = groupBasketballMatchups([
      baseEvent({ id: "sportsbook-api:event-1:ARBITRAGE:MONEYLINE:" }),
      baseEvent({ id: "sportsbook-api:event-1:ARBITRAGE:POINT_SPREAD:" }),
      baseEvent({ id: "sportsbook-api:event-2:ARBITRAGE:MONEYLINE:", name: "Liberty @ Aces" }),
    ]);

    const movements = movementsForMatchup(
      [
        {
          eventId: "sportsbook-api:event-1:ARBITRAGE:MONEYLINE:",
          sport: "basketball",
          runnerId: "r1",
          runnerName: "Toronto Tempo",
          bookmaker: "DraftKings",
          from: 2.1,
          to: 1.95,
          changedAt: new Date().toISOString(),
          direction: "shortening",
        },
        {
          eventId: "sportsbook-api:event-2:ARBITRAGE:MONEYLINE:",
          sport: "basketball",
          runnerId: "r2",
          runnerName: "Liberty",
          bookmaker: "FanDuel",
          from: 2.4,
          to: 2.5,
          changedAt: new Date().toISOString(),
          direction: "drifting",
        },
      ],
      groups[0]!,
    );

    assert.equal(movements.length, 1);
    assert.equal(movements[0]?.runnerName, "Toronto Tempo");
  });
});