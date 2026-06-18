import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import { normalizeTank01MlbOdds } from "./tank01-mlb.adapter.js";

const ENRICHMENT: SportEvent[] = [
  {
    id: "baseball:1487500",
    sport: "baseball",
    name: "Baltimore Orioles @ Seattle Mariners",
    startTime: "2026-06-18T01:40:00.000Z",
    venue: "MLB",
    status: "live",
    clock: "Top 4th",
    score: "1 - 2",
    awayLogo: "orioles.png",
    homeLogo: "mariners.png",
    source: "highlightly-matches",
    runners: [],
  },
];

test("normalizes Tank01 MLB odds and enriches game state", () => {
  const event = normalizeTank01MlbOdds(
    {
      gameID: "20260617_BAL@SEA",
      gameDate: "20260617",
      awayTeam: "BAL",
      homeTeam: "SEA",
      last_updated_e_time: "1781746759.376522",
      sportsBooks: [
        {
          sportsBook: "bet365",
          odds: {
            awayTeamML: "+110",
            homeTeamML: "-130",
          },
        },
        {
          sportsBook: "draftkings",
          odds: {
            awayTeamML: "+115",
            homeTeamML: "-125",
          },
        },
      ],
    },
    { highlightly: ENRICHMENT, tank01Games: new Map() },
  );

  assert.ok(event);
  assert.equal(event.id, "tank01-mlb:20260617_BAL@SEA");
  assert.equal(event.name, "Baltimore Orioles @ Seattle Mariners");
  assert.equal(event.startTime, "2026-06-18T01:40:00.000Z");
  assert.equal(event.status, "live");
  assert.equal(event.clock, "Top 4th");
  assert.equal(event.score, "1 - 2");
  assert.equal(event.awayLogo, "orioles.png");
  assert.equal(event.homeLogo, "mariners.png");

  assert.equal(event.runners[0]?.name, "Baltimore Orioles");
  assert.equal(event.runners[0]?.bestBookmaker, "DraftKings");
  assert.equal(event.runners[0]?.bestPrice, 2.15);
  assert.equal(event.runners[1]?.name, "Seattle Mariners");
  assert.equal(event.runners[1]?.bestBookmaker, "DraftKings");
  assert.equal(event.runners[1]?.bestPrice, 1.8);
});

test("uses Tank01 game time when Highlightly enrichment is unavailable", () => {
  const event = normalizeTank01MlbOdds(
    {
      gameID: "20260617_KC@WAS",
      gameDate: "20260617",
      awayTeam: "KC",
      homeTeam: "WAS",
      sportsBooks: [
        {
          sportsBook: "bet365",
          odds: {
            awayTeamML: "+110",
            homeTeamML: "-130",
          },
        },
      ],
    },
    {
      highlightly: [],
      tank01Games: new Map([
        ["20260617_KC@WAS", { gameId: "20260617_KC@WAS", startTime: "2026-06-17T17:05:00.000Z" }],
      ]),
    },
  );

  assert.ok(event);
  assert.equal(event.name, "Kansas City Royals @ Washington Nationals");
  assert.equal(event.startTime, "2026-06-17T17:05:00.000Z");
});

test("uses Tank01 box score fields when present", () => {
  const event = normalizeTank01MlbOdds(
    {
      gameID: "20260617_BAL@SEA",
      gameDate: "20260617",
      awayTeam: "BAL",
      homeTeam: "SEA",
      sportsBooks: [
        {
          sportsBook: "bet365",
          odds: {
            awayTeamML: "+110",
            homeTeamML: "-130",
          },
        },
      ],
    },
    {
      highlightly: [],
      tank01Games: new Map([
        [
          "20260617_BAL@SEA",
          {
            gameId: "20260617_BAL@SEA",
            startTime: "2026-06-18T01:40:00.000Z",
            status: "live",
            clock: "Bot 4 - 2 outs",
            score: "2 - 1",
            venue: "T-Mobile Park",
          },
        ],
      ]),
    },
  );

  assert.ok(event);
  assert.equal(event.status, "live");
  assert.equal(event.clock, "Bot 4 - 2 outs");
  assert.equal(event.score, "2 - 1");
  assert.equal(event.venue, "T-Mobile Park");
});
