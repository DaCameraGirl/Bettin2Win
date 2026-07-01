import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import { mergeSoccerEvents } from "./soccer-merge.js";

test("merges ESPN prices onto BetMiner prediction events", () => {
  const betminer: SportEvent = {
    id: "soccer:1",
    sport: "soccer",
    name: "Arsenal @ Chelsea",
    startTime: "2026-06-22T19:00:00.000Z",
    status: "upcoming",
    source: "betminer",
    prediction: {
      pick: "Arsenal",
      label: "Away win",
      probability: 62,
      status: "pending",
    },
    runners: [
      { id: "away", name: "Arsenal", odds: [] },
      { id: "home", name: "Chelsea", odds: [] },
      { id: "draw", name: "Draw", odds: [] },
    ],
  };

  const espn: SportEvent = {
    id: "espn-soccer-odds:eng.1:99",
    sport: "soccer",
    name: "Arsenal @ Chelsea",
    startTime: "2026-06-22T19:00:00.000Z",
    status: "upcoming",
    source: "espn-soccer-odds",
    runners: [
      {
        id: "away",
        name: "Arsenal",
        odds: [{ bookmaker: "DraftKings", runnerId: "away", price: 2.5, impliedProbability: 0, lastUpdate: "" }],
        bestPrice: 2.5,
        bestBookmaker: "DraftKings",
      },
      { id: "home", name: "Chelsea", odds: [] },
      { id: "draw", name: "Draw", odds: [] },
    ],
  };

  const merged = mergeSoccerEvents([betminer], [espn]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.prediction?.pick, "Arsenal");
  assert.equal(merged[0]?.runners[0]?.bestPrice, 2.5);
  assert.match(merged[0]?.source ?? "", /betminer\+espn-soccer-odds/);
});