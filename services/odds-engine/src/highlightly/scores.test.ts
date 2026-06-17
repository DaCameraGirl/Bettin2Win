import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeBaseballScores, mapState } from "./scores.js";

const BODY = {
  data: [
    {
      awayTeam: { displayName: "San Diego Padres" },
      homeTeam: { displayName: "St. Louis Cardinals" },
      state: {
        score: { current: "0 - 1" },
        report: "Bottom 2nd",
        description: "In Progress",
      },
    },
    {
      awayTeam: { displayName: "San Francisco Giants" },
      homeTeam: { displayName: "Atlanta Braves" },
      state: { score: { current: "0 - 0" }, report: "", description: "Scheduled" },
    },
  ],
};

test("maps vendor descriptions to game state", () => {
  assert.equal(mapState("In Progress"), "live");
  assert.equal(mapState("Final"), "finished");
  assert.equal(mapState("Scheduled"), "scheduled");
});

test("normalizes live + scheduled baseball games", () => {
  const scores = normalizeBaseballScores(BODY);
  assert.equal(scores.length, 2);

  const live = scores[0];
  assert.equal(live?.matchName, "San Diego Padres @ St. Louis Cardinals");
  assert.equal(live?.state, "live");
  assert.equal(live?.current, "0 - 1");
  assert.equal(live?.detail, "Bottom 2nd");

  assert.equal(scores[1]?.state, "scheduled");
});

test("tolerates empty / garbage input", () => {
  assert.deepEqual(normalizeBaseballScores(null), []);
  assert.deepEqual(normalizeBaseballScores({ data: "x" }), []);
});
