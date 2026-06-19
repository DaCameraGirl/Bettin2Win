import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeNhlGame, normalizeNhlScoreboard } from "./nhl-scoreboard.adapter.js";

test("normalizes official NHL final game", () => {
  const event = normalizeNhlGame({
    id: 2025030416,
    gameState: "OFF",
    venue: { default: "T-Mobile Arena" },
    startTimeUTC: "2026-06-15T00:00:00Z",
    awayTeam: {
      abbrev: "CAR",
      score: 3,
      name: { default: "Hurricanes" },
      logo: "https://assets.nhle.com/logos/nhl/svg/CAR_light.svg",
    },
    homeTeam: {
      abbrev: "VGK",
      score: 0,
      name: { default: "Golden Knights" },
      logo: "https://assets.nhle.com/logos/nhl/svg/VGK_light.svg",
    },
  });

  assert.ok(event);
  assert.equal(event.id, "nhl-scoreboard:2025030416");
  assert.equal(event.name, "CAR Hurricanes @ VGK Golden Knights");
  assert.equal(event.venue, "T-Mobile Arena");
  assert.equal(event.status, "finished");
  assert.equal(event.clock, "Final");
  assert.equal(event.score, "3 - 0");
  assert.equal(event.source, "nhl-scoreboard");
  assert.equal(event.runners[0]?.name, "CAR Hurricanes");
  assert.equal(event.runners[0]?.bestPrice, undefined);
  assert.equal(event.awayLogo, "https://assets.nhle.com/logos/nhl/svg/CAR_light.svg");
});

test("normalizes official NHL scoreboard payload", () => {
  const events = normalizeNhlScoreboard({
    games: [
      {
        id: 1,
        gameState: "FUT",
        startTimeUTC: "2026-09-20T00:00:00Z",
        awayTeam: { abbrev: "WPG", name: { default: "Jets" } },
        homeTeam: { abbrev: "EDM", name: { default: "Oilers" } },
      },
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.name, "WPG Jets @ EDM Oilers");
  assert.equal(events[0]?.status, "upcoming");
});
