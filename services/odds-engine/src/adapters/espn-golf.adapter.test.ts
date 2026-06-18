import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnGolfEvent, normalizeEspnGolfScoreboard } from "./espn-golf.adapter.js";

test("normalizes ESPN golf leaderboard event", () => {
  const event = normalizeEspnGolfEvent({
    id: "401811952",
    name: "U.S. Open",
    shortName: "U.S. Open",
    date: "2026-06-18T04:00Z",
    endDate: "2026-06-21T04:00Z",
    season: { year: 2026 },
    competitions: [
      {
        status: {
          type: {
            name: "STATUS_IN_PROGRESS",
            state: "in",
            completed: false,
            shortDetail: "Round 1 - In Progress",
          },
        },
        competitors: [
          {
            id: "3470",
            order: 1,
            score: "-3",
            athlete: { displayName: "Rory McIlroy" },
            linescores: [{ period: 1, displayValue: "-3" }],
          },
          {
            id: "4426181",
            order: 2,
            score: "-2",
            athlete: { displayName: "Sam Stevens" },
            linescores: [{ period: 1, displayValue: "-2" }],
          },
        ],
      },
    ],
  });

  assert.ok(event);
  assert.equal(event.id, "espn-golf:401811952");
  assert.equal(event.name, "U.S. Open");
  assert.equal(event.startTime, "2026-06-18T04:00Z");
  assert.equal(event.venue, "PGA TOUR 2026");
  assert.equal(event.status, "live");
  assert.equal(event.clock, "Round 1 - In Progress");
  assert.equal(event.source, "espn-golf");
  assert.equal(event.runners.length, 2);
  assert.equal(event.runners[0]?.name, "Rory McIlroy (-3 / R1 -3)");
  assert.equal(event.runners[0]?.number, 1);
  assert.equal(event.runners[0]?.position, 1);
  assert.equal(event.runners[0]?.bestPrice, undefined);
});

test("normalizes ESPN golf scoreboard payload", () => {
  const events = normalizeEspnGolfScoreboard({
    events: [
      {
        id: "1",
        shortName: "Travelers Championship",
        date: "2026-06-25T04:00Z",
        competitions: [
          {
            status: { type: { state: "pre", description: "Scheduled" } },
            competitors: [],
          },
        ],
      },
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, "espn-golf:1");
  assert.equal(events[0]?.status, "upcoming");
});
