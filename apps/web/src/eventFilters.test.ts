import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SportEvent } from "@bettin2win/types";
import {
  filterBoardEvents,
  filterBasketballMatchups,
  isBeginnerFriendlyEvent,
  matchupPassesBoardFilter,
} from "./eventFilters";
import { groupBasketballMatchups } from "./matchupGroup";

const baseEvent = (overrides: Partial<SportEvent>): SportEvent => ({
  id: "test-1",
  sport: "football",
  name: "Chiefs @ Eagles",
  startTime: "2026-06-22T23:00:00.000Z",
  status: "upcoming",
  source: "test",
  runners: [
    { id: "a", name: "Chiefs", odds: [{ bookmaker: "DK", runnerId: "a", price: 2.1, impliedProbability: 0, lastUpdate: "" }], bestPrice: 2.1 },
    { id: "b", name: "Eagles", odds: [{ bookmaker: "DK", runnerId: "b", price: 1.8, impliedProbability: 0, lastUpdate: "" }], bestPrice: 1.8 },
  ],
  ...overrides,
});

describe("eventFilters", () => {
  it("treats simple two-team moneylines as beginner-friendly", () => {
    assert.equal(isBeginnerFriendlyEvent(baseEvent({})), true);
  });

  it("excludes spread and soccer three-way markets from beginner-friendly", () => {
    assert.equal(
      isBeginnerFriendlyEvent(baseEvent({
        id: "sportsbook-api:abc:ARBITRAGE:POINT_SPREAD:",
        sport: "basketball",
        runners: [
          { id: "a", name: "Tempo -3.5", odds: [] },
          { id: "b", name: "Dream +3.5", odds: [] },
        ],
      })),
      false,
    );
    assert.equal(
      isBeginnerFriendlyEvent(baseEvent({
        sport: "soccer",
        name: "Rangers @ Celtic",
        runners: [
          { id: "a", name: "Rangers", odds: [] },
          { id: "b", name: "Draw", odds: [] },
          { id: "c", name: "Celtic", odds: [] },
        ],
      })),
      false,
    );
  });

  it("filters live games and priced games", () => {
    const events = [
      baseEvent({ id: "live", status: "live" }),
      baseEvent({ id: "upcoming", status: "upcoming", runners: [{ id: "a", name: "Chiefs", odds: [] }, { id: "b", name: "Eagles", odds: [] }] }),
    ];

    assert.equal(filterBoardEvents(events, "live").length, 1);
    assert.equal(filterBoardEvents(events, "with-prices").length, 1);
    assert.equal(filterBoardEvents(events, "beginner-friendly").length, 2);
  });

  it("filters basketball matchups by moneyline beginner-friendly and live status", () => {
    const groups = groupBasketballMatchups([
      baseEvent({
        id: "demo-basketball-0",
        sport: "basketball",
        name: "Mavericks @ Celtics",
        status: "live",
      }),
      baseEvent({
        id: "sportsbook-api:demo-basketball-0:ARBITRAGE:POINT_SPREAD:",
        sport: "basketball",
        name: "Mavericks @ Celtics",
        runners: [
          { id: "a", name: "Mavericks -3.5", odds: [] },
          { id: "b", name: "Celtics +3.5", odds: [] },
        ],
      }),
      baseEvent({
        id: "demo-basketball-1",
        sport: "basketball",
        name: "Lakers @ Warriors",
        status: "upcoming",
      }),
    ]);

    assert.equal(filterBasketballMatchups(groups, "live").length, 1);
    assert.equal(
      matchupPassesBoardFilter(groups[0]!, "beginner-friendly"),
      true,
    );
  });
});