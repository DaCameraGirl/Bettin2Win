import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnNbaOddsEvent } from "./espn-nba-odds.adapter.js";

test("normalizes ESPN WNBA game with DraftKings moneyline odds", () => {
  const event = normalizeEspnNbaOddsEvent(
    {
      id: "401857012",
      date: "2026-06-22T23:00Z",
      competitions: [
        {
          competitors: [
            {
              homeAway: "away",
              score: "0",
              team: {
                displayName: "Las Vegas Aces",
                logos: [{ href: "https://example.com/lv.png" }],
              },
            },
            {
              homeAway: "home",
              score: "0",
              team: {
                displayName: "Seattle Storm",
                logos: [{ href: "https://example.com/sea.png" }],
              },
            },
          ],
          status: {
            type: { state: "pre", completed: false, shortDetail: "Today 7:00 PM" },
          },
          odds: [
            {
              provider: { displayName: "DraftKings" },
              moneyline: {
                away: { close: { odds: "+124" } },
                home: { close: { odds: "-148" } },
              },
            },
          ],
        },
      ],
    },
    "WNBA",
  );

  assert.ok(event);
  assert.equal(event.id, "espn-nba-odds:401857012");
  assert.equal(event.name, "Las Vegas Aces @ Seattle Storm");
  assert.equal(event.venue, "WNBA");
  assert.equal(event.source, "espn-nba-odds");
  assert.equal(event.runners[0]?.bestBookmaker, "DraftKings");
  assert.equal(event.runners[0]?.bestPrice, 2.24);
  assert.equal(event.runners[1]?.bestPrice, 1.676);
});