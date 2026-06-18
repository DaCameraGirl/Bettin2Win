import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeMlbStatsGame, normalizeMlbStatsSchedule } from "./mlb-stats.adapter.js";

test("normalizes live MLB Stats game with inning and score", () => {
  const event = normalizeMlbStatsGame({
    gamePk: 824748,
    gameDate: "2026-06-18T17:35:00Z",
    venue: { name: "Fenway Park" },
    status: {
      abstractGameState: "Live",
      detailedState: "In Progress",
      codedGameState: "I",
    },
    teams: {
      away: { score: 3, team: { name: "Toronto Blue Jays" } },
      home: { score: 0, team: { name: "Boston Red Sox" } },
    },
    linescore: {
      currentInningOrdinal: "7th",
      inningState: "Middle",
    },
  });

  assert.ok(event);
  assert.equal(event.id, "mlb-stats:824748");
  assert.equal(event.name, "Toronto Blue Jays @ Boston Red Sox");
  assert.equal(event.startTime, "2026-06-18T17:35:00Z");
  assert.equal(event.venue, "Fenway Park");
  assert.equal(event.status, "live");
  assert.equal(event.clock, "Middle 7th");
  assert.equal(event.score, "3 - 0");
  assert.equal(event.source, "mlb-stats");
  assert.equal(event.runners.length, 2);
  assert.equal(event.runners[0]?.name, "Toronto Blue Jays");
  assert.equal(event.runners[0]?.bestPrice, undefined);
});

test("normalizes final and upcoming MLB Stats games", () => {
  const finalEvent = normalizeMlbStatsGame({
    gamePk: 1,
    gameDate: "2026-06-18T01:40:00Z",
    status: { abstractGameState: "Final", detailedState: "Final", codedGameState: "F" },
    teams: {
      away: { score: 3, team: { name: "Baltimore Orioles" } },
      home: { score: 5, team: { name: "Seattle Mariners" } },
    },
  });
  const upcomingEvent = normalizeMlbStatsGame({
    gamePk: 2,
    gameDate: "2026-06-18T20:10:00Z",
    status: { abstractGameState: "Preview", detailedState: "Pre-Game" },
    teams: {
      away: { team: { name: "New York Mets" } },
      home: { team: { name: "Philadelphia Phillies" } },
    },
  });

  assert.ok(finalEvent);
  assert.equal(finalEvent.status, "finished");
  assert.equal(finalEvent.clock, "Final");
  assert.equal(finalEvent.score, "3 - 5");

  assert.ok(upcomingEvent);
  assert.equal(upcomingEvent.status, "upcoming");
  assert.equal(upcomingEvent.clock, "Pre-Game");
  assert.equal(upcomingEvent.score, undefined);
});

test("normalizes full MLB Stats schedule payload", () => {
  const events = normalizeMlbStatsSchedule({
    dates: [
      {
        games: [
          {
            gamePk: 824748,
            gameDate: "2026-06-18T17:35:00Z",
            status: { abstractGameState: "Live", detailedState: "In Progress" },
            teams: {
              away: { score: 3, team: { name: "Toronto Blue Jays" } },
              home: { score: 0, team: { name: "Boston Red Sox" } },
            },
          },
        ],
      },
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.name, "Toronto Blue Jays @ Boston Red Sox");
});
