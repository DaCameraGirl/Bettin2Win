import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnNascarEvent, normalizeEspnNascarScoreboard } from "./espn-nascar.adapter.js";

test("normalizes ESPN NASCAR Cup race leaderboard", () => {
  const event = normalizeEspnNascarEvent({
    id: "401760001",
    name: "NASCAR Cup Series at San Diego",
    shortName: "San Diego",
    date: "2026-06-22T02:00Z",
    endDate: "2026-06-22T05:00Z",
    competitions: [
      {
        venue: { fullName: "San Diego Street Course" },
        status: {
          type: {
            state: "post",
            completed: true,
            description: "Final",
            shortDetail: "Final",
          },
        },
        competitors: [
          {
            id: "5670",
            order: 1,
            winner: true,
            carNumber: 23,
            athlete: { displayName: "Corey Heim" },
          },
          {
            id: "4534",
            order: 2,
            athlete: { displayName: "Bubba Wallace" },
          },
        ],
      },
    ],
  });

  assert.ok(event);
  assert.equal(event.id, "espn-nascar:401760001");
  assert.equal(event.name, "San Diego");
  assert.equal(event.venue, "San Diego Street Course");
  assert.equal(event.status, "finished");
  assert.equal(event.clock, "Final");
  assert.equal(event.source, "espn-nascar");
  assert.equal(event.runners[0]?.name, "Corey Heim (Winner)");
  assert.equal(event.runners[0]?.position, 1);
  assert.equal(event.runners[0]?.number, 23);
  assert.equal(event.runners[1]?.name, "Bubba Wallace");
  assert.equal(event.runners[1]?.position, 2);
});

test("normalizes ESPN NASCAR scoreboard payload", () => {
  const events = normalizeEspnNascarScoreboard({
    events: [
      {
        id: "1",
        name: "Daytona 500",
        date: "2026-02-15T18:30Z",
        competitions: [
          {
            competitors: [{ id: "1", order: 1, athlete: { displayName: "Kyle Larson" } }],
            status: { type: { state: "post", completed: true } },
          },
        ],
      },
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, "espn-nascar:1");
});