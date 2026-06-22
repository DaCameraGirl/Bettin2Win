import { test } from "node:test";
import assert from "node:assert/strict";
import type { SportEvent } from "@bettin2win/types";
import {
  classifyWeatherImpact,
  geoQueryForEvent,
  homeTeamFromName,
} from "./impact.js";

const footballEvent: SportEvent = {
  id: "test-1",
  sport: "football",
  name: "Buffalo Bills @ New York Jets",
  startTime: "2026-12-01T18:00:00.000Z",
  venue: "MetLife Stadium",
  status: "upcoming",
  source: "test",
  runners: [],
};

test("homeTeamFromName parses away @ home", () => {
  assert.equal(homeTeamFromName("Buffalo Bills @ New York Jets"), "New York Jets");
});

test("geoQueryForEvent prefers real venue names", () => {
  assert.equal(geoQueryForEvent(footballEvent), "MetLife Stadium, New York Jets");
});

test("classifyWeatherImpact flags wind and rain for football", () => {
  const impact = classifyWeatherImpact(footballEvent, {
    temperatureF: 41,
    windMph: 18,
    precipitationChance: 55,
    weatherCode: 61,
  });

  assert.equal(impact.impactLevel, "medium");
  assert.ok(impact.badges.includes("wind-alert"));
  assert.ok(impact.badges.includes("rain-risk"));
  assert.match(impact.summary, /41°F/);
  assert.match(impact.summary, /Wind 18 mph/);
  assert.match(impact.whyItMatters, /field goals/i);
});

test("classifyWeatherImpact adds track condition for greyhound racing", () => {
  const event: SportEvent = {
    ...footballEvent,
    id: "gh-1",
    sport: "greyhound",
    name: "Race 6 - Hove 19:48",
    venue: "Hove",
  };

  const impact = classifyWeatherImpact(event, {
    temperatureF: 58,
    windMph: 10,
    precipitationChance: 62,
    weatherCode: 63,
  });

  assert.ok(impact.badges.includes("track-condition"));
  assert.equal(impact.trackCondition, "Soft / muddy likely");
});