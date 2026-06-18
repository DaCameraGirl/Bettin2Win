import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSportsbookAdvantages } from "./sportsbook-advantages.adapter.js";

test("normalizes Sportsbook API basketball opportunities", () => {
  const events = normalizeSportsbookAdvantages("basketball", {
    advantages: {
      ARBITRAGE: [
        {
          type: "ARBITRAGE",
          value: 0.0967,
          outcomes: [
            {
              modifier: -1.5,
              payout: 2.48,
              source: "DRAFT_KINGS",
              type: "WIN",
              live: false,
              participantKey: "away-key",
              time: "2026-06-18T02:34:00.093Z",
            },
            {
              modifier: 1.5,
              payout: 2,
              source: "FAN_DUEL",
              type: "WIN",
              live: false,
              participantKey: "home-key",
              time: "2026-06-18T02:34:00.176Z",
            },
          ],
          context: {
            eventKey: "event-1",
            eventSport: "BASKETBALL",
            eventName: "Liberty @ Aces",
            eventStartTime: "2026-06-18T22:00:00.000Z",
            marketType: "POINT_SPREAD",
            competitionShortName: "WNBA",
            eventParticipants: [
              { key: "away-key", name: "Liberty" },
              { key: "home-key", name: "Aces" },
            ],
          },
        },
      ],
    },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.name, "Liberty @ Aces");
  assert.equal(events[0]?.venue, "WNBA - Arbitrage 9.7% - Point Spread");
  assert.equal(events[0]?.runners[0]?.name, "Liberty -1.5");
  assert.equal(events[0]?.runners[0]?.bestBookmaker, "DraftKings");
  assert.equal(events[0]?.runners[0]?.bestPrice, 2.48);
  assert.equal(events[0]?.runners[1]?.name, "Aces +1.5");
  assert.equal(events[0]?.runners[1]?.bestBookmaker, "FanDuel");
});
