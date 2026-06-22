import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SportEvent } from "@bettin2win/types";
import {
  explainEvent,
  impliedPercent,
  plainEnglishPayout,
  profitForStake,
} from "./oddsExplain";

describe("oddsExplain", () => {
  it("calculates profit for decimal odds", () => {
    const result = profitForStake(2.5, 100);
    assert.equal(result.profit, 150);
    assert.equal(result.totalReturn, 250);
  });

  it("describes favorite and underdog payouts", () => {
    assert.match(plainEnglishPayout("Lakers", 1.67), /favorite/i);
    assert.match(plainEnglishPayout("Celtics", 2.3), /underdog/i);
  });

  it("builds a two-team moneyline explanation", () => {
    const event: SportEvent = {
      id: "test",
      sport: "basketball",
      name: "Lakers @ Celtics",
      startTime: new Date().toISOString(),
      status: "upcoming",
      source: "test",
      runners: [
        {
          id: "away",
          name: "Lakers",
          odds: [
            { bookmaker: "A", runnerId: "away", price: 2.1, impliedProbability: 0, lastUpdate: "" },
            { bookmaker: "B", runnerId: "away", price: 2.0, impliedProbability: 0, lastUpdate: "" },
          ],
          bestPrice: 2.1,
          bestBookmaker: "A",
        },
        {
          id: "home",
          name: "Celtics",
          odds: [
            { bookmaker: "A", runnerId: "home", price: 1.8, impliedProbability: 0, lastUpdate: "" },
            { bookmaker: "B", runnerId: "home", price: 1.75, impliedProbability: 0, lastUpdate: "" },
          ],
          bestPrice: 1.8,
          bestBookmaker: "A",
        },
      ],
    };

    const explanation = explainEvent(event, "american");
    assert.ok(explanation);
    assert.equal(explanation.runners.length, 2);
    assert.ok(explanation.riskBadges.some((badge) => badge.label === "beginner-friendly"));
    assert.equal(impliedPercent(2), 50);
    assert.match(explanation.houseMarginNote ?? "", /more than 100%/i);
    assert.match(explanation.houseMarginNote ?? "", /isn't everyone rich/i);
  });
});