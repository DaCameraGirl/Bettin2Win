import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnNflOddsEvent } from "./espn-nfl-odds.adapter.js";

test("normalizes ESPN NFL game with DraftKings moneyline odds", () => {
  const event = normalizeEspnNflOddsEvent({
    id: "401872656",
    date: "2026-08-15T23:30Z",
    competitions: [
      {
        venue: [{ fullName: "Lumen Field" }],
        competitors: [
          {
            homeAway: "away",
            score: "0",
            team: {
              displayName: "New England Patriots",
              logos: [{ href: "https://example.com/ne.png" }],
            },
          },
          {
            homeAway: "home",
            score: "0",
            team: {
              displayName: "Seattle Seahawks",
              logos: [{ href: "https://example.com/sea.png" }],
            },
          },
        ],
        status: {
          type: { state: "pre", completed: false, shortDetail: "Sat, August 15th at 7:30 PM EDT" },
        },
        odds: [
          {
            provider: { displayName: "DraftKings" },
            moneyline: {
              away: { close: { odds: "+170" } },
              home: { close: { odds: "-205" } },
            },
          },
        ],
      },
    ],
  });

  assert.ok(event);
  assert.equal(event.id, "espn-nfl-odds:401872656");
  assert.equal(event.name, "New England Patriots @ Seattle Seahawks");
  assert.equal(event.source, "espn-nfl-odds");
  assert.equal(event.runners[0]?.bestBookmaker, "DraftKings");
  assert.equal(event.runners[0]?.bestPrice, 2.7);
  assert.equal(event.runners[1]?.bestPrice, 1.488);
});