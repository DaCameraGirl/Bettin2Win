import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import { detectMovements } from "./movement.js";

function event(bestPrice: number): SportEvent {
  return {
    id: "e1",
    sport: "horse-racing",
    name: "Race 1",
    startTime: new Date().toISOString(),
    status: "upcoming",
    source: "mock",
    runners: [
      { id: "r1", name: "Silver Comet", odds: [], bestPrice },
    ],
  };
}

test("no movement on first snapshot", () => {
  assert.equal(detectMovements(undefined, event(4.0)).length, 0);
});

test("detects shortening price", () => {
  const moves = detectMovements(event(4.0), event(3.4));
  assert.equal(moves.length, 1);
  assert.equal(moves[0]?.direction, "shortening");
});

test("ignores moves under threshold", () => {
  assert.equal(detectMovements(event(4.0), event(4.02)).length, 0);
});
