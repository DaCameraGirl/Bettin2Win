import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnNhlEvent, normalizeEspnNhlScoreboard } from "./espn-nhl-odds.adapter.js";

test("normalizes ESPN NHL game with DraftKings moneyline odds", () => {
  const event = normalizeEspnNhlEvent({
    id: "401802951",
    date: "2026-06-15T00:00Z",
    competitions: [
      {
        venue: { fullName: "T-Mobile Arena" },
        competitors: [
          {
            homeAway: "home",
            score: "0",
            team: {
              displayName: "Vegas Golden Knights",
              logo: "https://a.espncdn.com/i/teamlogos/nhl/500/vgk.png",
            },
          },
          {
            homeAway: "away",
            score: "3",
            team: {
              displayName: "Carolina Hurricanes",
              logo: "https://a.espncdn.com/i/teamlogos/nhl/500/car.png",
            },
          },
        ],
        status: {
          type: {
            state: "post",
            completed: true,
            description: "Final",
            shortDetail: "Final",
          },
        },
        odds: [
          {
            provider: { displayName: "DraftKings" },
            moneyline: {
              away: { close: { odds: "+145" } },
              home: { close: { odds: "-175" } },
            },
          },
        ],
      },
    ],
  });

  assert.ok(event);
  assert.equal(event.id, "espn-nhl-odds:401802951");
  assert.equal(event.name, "Carolina Hurricanes @ Vegas Golden Knights");
  assert.equal(event.venue, "T-Mobile Arena");
  assert.equal(event.status, "finished");
  assert.equal(event.score, "3 - 0");
  assert.equal(event.source, "espn-nhl-odds");
  assert.equal(event.runners[0]?.bestBookmaker, "DraftKings");
  assert.equal(event.runners[0]?.bestPrice, 2.45);
  assert.equal(event.runners[1]?.bestPrice, 1.571);
});

test("normalizes ESPN NHL scoreboard payload", () => {
  const events = normalizeEspnNhlScoreboard({
    events: [
      {
        id: "1",
        date: "2026-09-20T00:00Z",
        competitions: [
          {
            competitors: [
              { homeAway: "away", team: { displayName: "Winnipeg Jets" } },
              { homeAway: "home", team: { displayName: "Edmonton Oilers" } },
            ],
            status: { type: { state: "pre" } },
          },
        ],
      },
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, "espn-nhl-odds:1");
});