import { test } from "node:test";
import assert from "node:assert/strict";
import type { OddsMovement } from "@bettin2win/types";
import { InsightGenerator } from "./index.js";

const movement: OddsMovement = {
  eventId: "e1",
  sport: "horse-racing",
  runnerId: "r1",
  runnerName: "Silver Comet",
  bookmaker: "best",
  from: 4.0,
  to: 3.4,
  changedAt: new Date().toISOString(),
  direction: "shortening",
};

test("generates an insight mentioning the runner", async () => {
  const gen = new InsightGenerator();
  const insight = await gen.fromMovement(movement, "bettor");
  assert.ok(insight.text.includes("Silver Comet"));
  assert.equal(insight.persona, "bettor");
});

test("analyst persona includes implied probability", async () => {
  const gen = new InsightGenerator();
  const insight = await gen.fromMovement(movement, "analyst");
  assert.match(insight.text, /implied probability/);
});
