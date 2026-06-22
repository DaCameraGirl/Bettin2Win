import assert from "node:assert/strict";
import test from "node:test";
import type { Runner } from "@bettin2win/types";
import {
  programOrder,
  raceCaption,
  raceLaneTiming,
  resolveRunnerNumber,
  trackRunners,
} from "./raceDisplay";

function runner(partial: Partial<Runner> & Pick<Runner, "id" | "name">): Runner {
  return { odds: [], ...partial };
}

test("resolveRunnerNumber prefers cloth/trap fields and name parsing", () => {
  assert.equal(resolveRunnerNumber(runner({ id: "a", name: "Swift", number: 4 })), 4);
  assert.equal(resolveRunnerNumber(runner({ id: "b", name: "Trap 6 Bold Lass" })), 6);
  assert.equal(resolveRunnerNumber(runner({ id: "c", name: "3. Night Runner" })), 3);
});

test("programOrder sorts by program number, not favourite price", () => {
  const ordered = programOrder([
    runner({ id: "a", name: "Favourite", number: 5, bestPrice: 2.1 }),
    runner({ id: "b", name: "Longshot", number: 2, bestPrice: 12 }),
    runner({ id: "c", name: "Mid", number: 7, bestPrice: 5 }),
  ]);
  assert.deepEqual(
    ordered.map((entry) => entry.number),
    [2, 5, 7],
  );
});

test("trackRunners keeps every horse/greyhound entrant on the strip", () => {
  const entries = Array.from({ length: 9 }, (_, index) =>
    runner({ id: `r${index}`, name: `Horse ${index + 1}`, number: index + 1 }),
  );
  assert.equal(trackRunners("horse-racing", entries).length, 9);
  assert.equal(trackRunners("nascar", entries).length, 6);
});

test("raceLaneTiming is slower for horses and greyhounds than NASCAR", () => {
  const horse = raceLaneTiming("horse-racing", 3, false);
  const car = raceLaneTiming("nascar", 3, false);
  assert.ok(Number.parseFloat(horse.duration) > Number.parseFloat(car.duration));
  assert.ok(Math.abs(Number.parseFloat(horse.delay)) > Math.abs(Number.parseFloat(car.delay)));
});

test("raceCaption lists actual program numbers", () => {
  const shown = [
    runner({ id: "a", name: "Trap 2 Jet" }),
    runner({ id: "b", name: "Trap 5 Ace", number: 5 }),
    runner({ id: "c", name: "Trap 8 Fox", number: 8 }),
  ];
  assert.match(
    raceCaption("greyhound", shown, 3, false, false, "🐕"),
    /3 on track · #2, 5, 8/,
  );
});