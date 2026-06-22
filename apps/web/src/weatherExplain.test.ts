import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SportEvent } from "@bettin2win/types";
import {
  buildDemoWeatherImpacts,
  demoWeatherImpactForEvent,
  indoorWeatherImpact,
  weatherImpactCardLabel,
} from "./weatherExplain";

describe("weatherExplain", () => {
  it("formats outdoor football demo with medium wind and rain", () => {
    const event: SportEvent = {
      id: "demo-football-0",
      sport: "football",
      name: "Chiefs @ Eagles",
      startTime: new Date().toISOString(),
      status: "live",
      source: "demo",
      runners: [],
    };

    const impact = demoWeatherImpactForEvent(event);
    assert.ok(impact);
    assert.equal(impact.impactLevel, "medium");
    assert.match(impact.summary, /Wind 18 mph/);
    assert.match(impact.summary, /Rain likely/);
    assert.match(impact.whyItMatters, /long passes/i);
    assert.match(impact.whyItMatters, /handling mistakes/i);

    const label = weatherImpactCardLabel(impact, event.sport);
    assert.equal(label.kicker, "Weather Impact");
    assert.equal(label.level, "Medium");
  });

  it("formats greyhound demo with muddy track condition", () => {
    const event: SportEvent = {
      id: "demo-greyhound-0",
      sport: "greyhound",
      name: "Race 6 - Hove 19:48",
      startTime: new Date().toISOString(),
      status: "live",
      source: "demo",
      runners: [],
    };

    const impact = demoWeatherImpactForEvent(event);
    assert.ok(impact);
    assert.equal(impact.trackCondition, "Muddy");
    assert.match(impact.summary, /Rain earlier today/i);

    const label = weatherImpactCardLabel(impact, event.sport);
    assert.equal(label.kicker, "Track Condition");
    assert.equal(label.level, "Muddy");
  });

  it("uses beginner-friendly indoor copy without betting advice", () => {
    const impact = indoorWeatherImpact("demo-basketball-0");
    assert.equal(impact.headline, "Indoor venue");
    assert.match(impact.summary, /unlikely to affect play/i);
    assert.doesNotMatch(impact.whyItMatters, /odds/i);
    assert.doesNotMatch(impact.whyItMatters, /wager/i);

    const label = weatherImpactCardLabel(impact, "basketball");
    assert.equal(label.level, "Indoor venue");
  });

  it("builds demo impacts for every demo event on the board", () => {
    const events: SportEvent[] = [
      {
        id: "demo-football-0",
        sport: "football",
        name: "Chiefs @ Eagles",
        startTime: new Date().toISOString(),
        status: "live",
        source: "demo",
        runners: [],
      },
      {
        id: "demo-basketball-0",
        sport: "basketball",
        name: "Mavericks @ Celtics",
        startTime: new Date().toISOString(),
        status: "upcoming",
        source: "demo",
        runners: [],
      },
    ];

    const impacts = buildDemoWeatherImpacts(events);
    assert.equal(Object.keys(impacts).length, 2);
    assert.equal(impacts["demo-football-0"]?.impactLevel, "medium");
    assert.equal(impacts["demo-basketball-0"]?.badges[0], "indoor-venue");
  });
});