import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import { LineHistoryStore } from "./line-history.js";

test("tracks pregame favorite, freezes closing line, and marks favorite win", () => {
  const { store, setNow, cleanup } = testStore("2026-06-19T22:00:00.000Z");
  try {
    const tracking = store.decorate(game({ status: "upcoming", score: undefined }));
    assert.equal(tracking.lineCheck?.status, "tracking");
    assert.equal(tracking.lineCheck?.favorite, "Detroit Tigers");
    assert.equal(tracking.lineCheck?.favoritePrice, 1.478);
    assert.equal(tracking.lineCheck?.favoriteBookmaker, "DraftKings");

    setNow("2026-06-19T22:41:00.000Z");
    const live = store.decorate(game({ status: "live", score: "0 - 0", odds: false }));
    assert.equal(live.lineCheck?.status, "pending-result");
    assert.equal(live.lineCheck?.favorite, "Detroit Tigers");
    assert.equal(live.lineCheck?.closedAt, "2026-06-19T22:41:00.000Z");

    const finished = store.decorate(game({ status: "finished", score: "2 - 5", odds: false }));
    assert.equal(finished.lineCheck?.status, "favorite-won");
    assert.equal(finished.lineCheck?.winner, "Detroit Tigers");
  } finally {
    cleanup();
  }
});

test("marks closing favorite lost when the underdog wins", () => {
  const { store, setNow, cleanup } = testStore("2026-06-19T22:00:00.000Z");
  try {
    store.decorate(game({ status: "upcoming", score: undefined }));
    setNow("2026-06-19T22:41:00.000Z");
    store.decorate(game({ status: "live", score: "0 - 0", odds: false }));

    const finished = store.decorate(game({ status: "finished", score: "6 - 2", odds: false }));
    assert.equal(finished.lineCheck?.status, "favorite-lost");
    assert.equal(finished.lineCheck?.favorite, "Detroit Tigers");
    assert.equal(finished.lineCheck?.winner, "Chicago White Sox");
  } finally {
    cleanup();
  }
});

test("loads saved closing-line history across store instances", () => {
  const dir = mkdtempSync(join(tmpdir(), "b2w-lines-"));
  const file = join(dir, "history.json");
  let now = new Date("2026-06-19T22:00:00.000Z");

  try {
    const first = new LineHistoryStore(file, () => now);
    first.decorate(game({ status: "upcoming", score: undefined }));

    now = new Date("2026-06-19T22:41:00.000Z");
    const second = new LineHistoryStore(file, () => now);
    const live = second.decorate(game({ status: "live", score: "0 - 0", odds: false }));
    assert.equal(live.lineCheck?.status, "pending-result");
    assert.equal(live.lineCheck?.favorite, "Detroit Tigers");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function testStore(start: string): {
  store: LineHistoryStore;
  setNow: (value: string) => void;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), "b2w-lines-"));
  const file = join(dir, "history.json");
  let now = new Date(start);
  return {
    store: new LineHistoryStore(file, () => now),
    setNow: (value: string) => {
      now = new Date(value);
    },
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function game({
  status,
  score,
  odds = true,
}: {
  status: SportEvent["status"];
  score?: string;
  odds?: boolean;
}): SportEvent {
  return {
    id: "espn-mlb-odds:401815812",
    sport: "baseball",
    name: "Chicago White Sox @ Detroit Tigers",
    startTime: "2026-06-19T22:40:00.000Z",
    status,
    score,
    source: "espn-mlb-odds",
    runners: [
      {
        id: "away",
        name: "Chicago White Sox",
        odds: odds
          ? [{
              bookmaker: "DraftKings",
              runnerId: "away",
              price: 2.71,
              impliedProbability: 1 / 2.71,
              lastUpdate: "2026-06-19T22:00:00.000Z",
            }]
          : [],
        bestPrice: odds ? 2.71 : undefined,
        bestBookmaker: odds ? "DraftKings" : undefined,
      },
      {
        id: "home",
        name: "Detroit Tigers",
        odds: odds
          ? [{
              bookmaker: "DraftKings",
              runnerId: "home",
              price: 1.478,
              impliedProbability: 1 / 1.478,
              lastUpdate: "2026-06-19T22:00:00.000Z",
            }]
          : [],
        bestPrice: odds ? 1.478 : undefined,
        bestBookmaker: odds ? "DraftKings" : undefined,
      },
    ],
  };
}
