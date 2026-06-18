import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeHighlightlyMatch } from "./highlightly-matches.adapter.js";

test("normalizes Highlightly baseball backup match with score and logos", () => {
  const event = normalizeHighlightlyMatch("baseball", {
    id: 1487510,
    league: "MLB",
    date: "2026-06-17T23:40:00.000Z",
    state: {
      score: { current: "9 - 4" },
      report: "Final",
      description: "Finished",
    },
    homeTeam: {
      displayName: "Milwaukee Brewers",
      logo: "home.png",
    },
    awayTeam: {
      displayName: "Cleveland Guardians",
      logo: "away.png",
    },
  });

  assert.ok(event);
  assert.equal(event.id, "baseball:1487510");
  assert.equal(event.name, "Cleveland Guardians @ Milwaukee Brewers");
  assert.equal(event.startTime, "2026-06-17T23:40:00.000Z");
  assert.equal(event.venue, "MLB");
  assert.equal(event.status, "finished");
  assert.equal(event.clock, "Final");
  assert.equal(event.score, "9 - 4");
  assert.equal(event.awayLogo, "away.png");
  assert.equal(event.homeLogo, "home.png");
  assert.equal(event.runners.length, 2);
  assert.equal(event.runners[0]?.name, "Cleveland Guardians");
  assert.equal(event.runners[0]?.bestPrice, undefined);
});

test("normalizes Highlightly basketball upcoming match with league and date", () => {
  const event = normalizeHighlightlyMatch("basketball", {
    id: 426674313,
    date: "2026-06-19T17:00:00.000Z",
    country: { name: "Turkey" },
    league: { name: "Super Ligi" },
    state: {
      score: { current: null },
      description: "Not started",
    },
    awayTeam: { name: "Fenerbahce", logo: "away.png" },
    homeTeam: { name: "Besiktas", logo: "home.png" },
  });

  assert.ok(event);
  assert.equal(event.id, "basketball:426674313");
  assert.equal(event.name, "Fenerbahce @ Besiktas");
  assert.equal(event.venue, "Turkey - Super Ligi");
  assert.equal(event.status, "upcoming");
  assert.equal(event.score, undefined);
});
