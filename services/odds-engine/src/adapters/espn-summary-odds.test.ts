import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import { applySummaryMoneyline, extractSummaryOdds } from "./espn-summary-odds.js";

test("extracts moneyline odds from ESPN summary pickcenter", () => {
  const odds = extractSummaryOdds({
    pickcenter: [{
      provider: { displayName: "DraftKings" },
      moneyline: {
        home: { close: { odds: "-650" } },
        away: { close: { odds: "+1400" } },
        draw: { close: { odds: "+650" } },
      },
    }],
  });

  assert.ok(odds);
  assert.equal(odds?.bookmaker, "DraftKings");
  assert.equal(odds?.home, 1.154);
  assert.equal(odds?.away, 15);
  assert.equal(odds?.draw, 7.5);
});

test("applies summary odds onto an unpriced soccer event", () => {
  const event: SportEvent = {
    id: "espn-soccer-odds:eng.1:401879301",
    sport: "soccer",
    name: "Coventry City @ Arsenal",
    startTime: "2026-06-22T19:00:00.000Z",
    status: "upcoming",
    source: "espn-soccer-odds",
    runners: [
      { id: "away", name: "Coventry City", odds: [] },
      { id: "home", name: "Arsenal", odds: [] },
      { id: "draw", name: "Draw", odds: [] },
    ],
  };

  const enriched = applySummaryMoneyline(event, {
    pickcenter: [{
      provider: { displayName: "DraftKings" },
      moneyline: {
        home: { close: { odds: "-650" } },
        away: { close: { odds: "+1400" } },
        draw: { close: { odds: "+650" } },
      },
    }],
  });

  assert.equal(enriched.runners[1]?.bestPrice, 1.154);
  assert.equal(enriched.runners[0]?.bestPrice, 15);
  assert.equal(enriched.runners[2]?.bestPrice, 7.5);
});