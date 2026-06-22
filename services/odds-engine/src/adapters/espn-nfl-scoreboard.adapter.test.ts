import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnNflEvent } from "./espn-nfl-scoreboard.adapter.js";

test("normalizes ESPN NFL scoreboard matchup", () => {
  const event = normalizeEspnNflEvent({
    id: "401547456",
    date: "2026-09-10T00:20Z",
    competitions: [
      {
        venue: [{ fullName: "Arrowhead Stadium" }],
        status: {
          type: { state: "pre", completed: false, shortDetail: "Thu, September 10th at 8:20 PM EDT" },
        },
        competitors: [
          {
            homeAway: "away",
            score: "0",
            team: {
              abbreviation: "BAL",
              displayName: "Baltimore Ravens",
              logos: [{ href: "https://example.com/bal.png" }],
            },
          },
          {
            homeAway: "home",
            score: "0",
            team: {
              abbreviation: "KC",
              displayName: "Kansas City Chiefs",
              logos: [{ href: "https://example.com/kc.png" }],
            },
          },
        ],
      },
    ],
  });

  assert.ok(event);
  assert.equal(event.id, "espn-nfl:401547456");
  assert.equal(event.name, "BAL @ KC");
  assert.equal(event.venue, "Arrowhead Stadium");
  assert.equal(event.status, "upcoming");
  assert.equal(event.source, "espn-nfl");
  assert.equal(event.runners.length, 2);
});