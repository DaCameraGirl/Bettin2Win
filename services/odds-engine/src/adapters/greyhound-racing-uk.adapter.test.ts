import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeGreyhoundRaceDetail } from "./greyhound-racing-uk.adapter.js";

test("normalizes greyhound race with trap numbers, positions, and SP odds", () => {
  const event = normalizeGreyhoundRaceDetail({
    id_race: "race-42",
    course: "Hove",
    title: "Race 6",
    date: "2026-06-22 19:48:00",
    finished: "1",
    dogs: [
      { id_dog: "d1", dog: "Swift Jet", trap: "1", position: "2", sp: "4.5", trainer: "A. Smith" },
      { id_dog: "d2", dog: "Bold Lass", trap: "2", position: "1", sp: "3.0" },
      { id_dog: "d3", dog: "Scratched", trap: "3", non_runner: "1" },
    ],
  }, "greyhound-racing-uk");

  assert.equal(event.id, "race-42");
  assert.equal(event.name, "Hove - Race 6");
  assert.equal(event.venue, "Hove");
  assert.equal(event.status, "finished");
  assert.equal(event.runners.length, 2);
  assert.equal(event.runners[0]?.name, "Trap 1 Swift Jet (A. Smith)");
  assert.equal(event.runners[0]?.number, 1);
  assert.equal(event.runners[0]?.position, 2);
  assert.equal(event.runners[0]?.bestPrice, 4.5);
  assert.equal(event.runners[1]?.name, "Trap 2 Bold Lass");
  assert.equal(event.runners[1]?.position, 1);
  assert.equal(event.runners[1]?.bestPrice, 3);
});