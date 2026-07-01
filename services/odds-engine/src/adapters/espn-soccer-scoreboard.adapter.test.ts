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
  assert.equal(event.id, "espn-soccer-odds:soccer:704842");
  assert.equal(event.name, "Arsenal @ Chelsea");
  assert.equal(event.venue, "Premier League");
  assert.equal(event.source, "espn-soccer-odds");
  assert.equal(event.runners.length, 3);
  assert.equal(event.runners[2]?.name, "Draw");
});

test("normalizes ESPN soccer match with 3-way DraftKings moneyline", () => {
  const event = normalizeEspnSoccerEvent(
    {
      id: "401879301",
      date: "2026-06-22T19:00Z",
      competitions: [
        {
          competitors: [
            { homeAway: "away", team: { displayName: "Coventry City" } },
            { homeAway: "home", team: { displayName: "Arsenal" } },
          ],
          odds: [
            {
              provider: { displayName: "DraftKings" },
              moneyline: {
                home: { close: { odds: "-650" } },
                away: { close: { odds: "+1400" } },
                draw: { close: { odds: "+650" } },
              },
            },
          ],
        },
      ],
    },
    "Premier League",
  );

  assert.ok(event);
  assert.equal(event.runners[0]?.bestPrice, 15);
  assert.equal(event.runners[1]?.bestPrice, 1.154);
  assert.equal(event.runners[2]?.bestPrice, 7.5);
});