import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import { mergeNhlEvents, matchupKey } from "./nhl-merge.js";

test("matchupKey links NHL abbrev names to ESPN full names", () => {
  assert.equal(matchupKey("CAR Hurricanes @ VGK Golden Knights"), "car@vgk");
  assert.equal(matchupKey("Carolina Hurricanes @ Vegas Golden Knights"), "car@vgk");
});

test("mergeNhlEvents copies ESPN prices onto NHL scoreboard games", () => {
  const scoreboard: SportEvent[] = [
    {
      id: "nhl-scoreboard:1",
      sport: "hockey",
      name: "CAR Hurricanes @ VGK Golden Knights",
      startTime: "2026-06-22T02:00:00.000Z",
      status: "finished",
      score: "3 - 0",
      source: "nhl-scoreboard",
      runners: [
        { id: "nhl-scoreboard:1:away", name: "CAR Hurricanes", odds: [] },
        { id: "nhl-scoreboard:1:home", name: "VGK Golden Knights", odds: [] },
      ],
    },
  ];

  const espn: SportEvent[] = [
    {
      id: "espn-nhl-odds:99",
      sport: "hockey",
      name: "Carolina Hurricanes @ Vegas Golden Knights",
      startTime: "2026-06-22T02:00:00.000Z",
      status: "finished",
      source: "espn-nhl-odds",
      runners: [
        {
          id: "espn-nhl-odds:99:away",
          name: "Carolina Hurricanes",
          odds: [{ bookmaker: "DraftKings", runnerId: "espn-nhl-odds:99:away", price: 2.45, impliedProbability: 0, lastUpdate: "" }],
          bestPrice: 2.45,
          bestBookmaker: "DraftKings",
        },
        {
          id: "espn-nhl-odds:99:home",
          name: "Vegas Golden Knights",
          odds: [{ bookmaker: "DraftKings", runnerId: "espn-nhl-odds:99:home", price: 1.571, impliedProbability: 0, lastUpdate: "" }],
          bestPrice: 1.571,
          bestBookmaker: "DraftKings",
        },
      ],
    },
  ];

  const merged = mergeNhlEvents(espn, scoreboard);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.id, "nhl-scoreboard:1");
  assert.equal(merged[0]?.score, "3 - 0");
  assert.equal(merged[0]?.runners[0]?.bestPrice, 2.45);
  assert.equal(merged[0]?.runners[1]?.bestBookmaker, "DraftKings");
});