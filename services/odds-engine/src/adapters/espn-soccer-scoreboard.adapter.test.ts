import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnSoccerEvent } from "./espn-soccer-scoreboard.adapter.js";

test("normalizes ESPN soccer scoreboard matchup", () => {
  const event = normalizeEspnSoccerEvent(
    {
      id: "704842",
      date: "2026-06-22T19:00Z",
      competitions: [
        {
          status: {
            type: { state: "pre", completed: false, shortDetail: "Scheduled" },
          },
          competitors: [
            {
              homeAway: "away",
              score: "0",
              team: { displayName: "Arsenal", logos: [{ href: "https://example.com/ars.png" }] },
            },
            {
              homeAway: "home",
              score: "0",
              team: { displayName: "Chelsea", logos: [{ href: "https://example.com/che.png" }] },
            },
          ],
        },
      ],
    },
    "Premier League",
  );

  assert.ok(event);
  assert.equal(event.id, "espn-soccer:704842");
  assert.equal(event.name, "Arsenal @ Chelsea");
  assert.equal(event.venue, "Premier League");
  assert.equal(event.source, "espn-soccer");
  assert.equal(event.runners.length, 3);
  assert.equal(event.runners[2]?.name, "Draw");
});