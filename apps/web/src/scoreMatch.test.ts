import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SportEvent } from "@bettin2win/types";
import type { GameScore } from "./useScores.js";
import {
  indexScoresByMatchName,
  pickPreferredScore,
  resolveGameScore,
  shouldApplyScoreToEvent,
} from "./scoreMatch.js";

function baseEvent(overrides: Partial<SportEvent> = {}): SportEvent {
  return {
    id: "evt-1",
    sport: "baseball",
    name: "Miami Marlins @ Colorado Rockies",
    startTime: new Date(Date.now() + 24 * 3_600_000).toISOString(),
    status: "upcoming",
    source: "the-odds-api",
    runners: [],
    ...overrides,
  };
}

const finishedScore: GameScore = {
  away: "Miami Marlins",
  home: "Colorado Rockies",
  matchName: "Miami Marlins @ Colorado Rockies",
  current: "3 - 14",
  state: "finished",
  detail: "Final",
};

describe("scoreMatch", () => {
  it("blocks finished scores from future rematches", () => {
    const event = baseEvent();
    assert.equal(shouldApplyScoreToEvent(event, finishedScore), false);
    assert.equal(resolveGameScore(event, new Map([[event.name, finishedScore]])), undefined);
  });

  it("allows finished scores for games that already started", () => {
    const event = baseEvent({
      startTime: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      status: "upcoming",
    });
    assert.equal(shouldApplyScoreToEvent(event, finishedScore), true);
  });

  it("prefers live scores when multiple rows share a matchup name", () => {
    const live: GameScore = { ...finishedScore, state: "live", current: "2 - 1", detail: "Top 5th" };
    assert.equal(pickPreferredScore(finishedScore, live), live);
    const map = indexScoresByMatchName([finishedScore, live]);
    assert.equal(map.get(finishedScore.matchName)?.state, "live");
  });
});