import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEspnMlbEvent, normalizeEspnMlbScoreboard } from "./espn-mlb-odds.adapter.js";

test("normalizes ESPN MLB game with DraftKings moneyline odds", () => {
  const event = normalizeEspnMlbEvent({
    id: "401815812",
    date: "2027-06-19T22:40Z",
    competitions: [
      {
        venue: { fullName: "Comerica Park" },
        competitors: [
          {
            homeAway: "home",
            score: "0",
            team: {
              displayName: "Detroit Tigers",
              logo: "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/det.png",
            },
          },
          {
            homeAway: "away",
            score: "0",
            team: {
              displayName: "Chicago White Sox",
              logo: "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/chw.png",
            },
          },
        ],
        status: {
          type: {
            state: "pre",
            description: "Scheduled",
            shortDetail: "6:40 PM EDT",
          },
        },
        odds: [
          {
            provider: { displayName: "DraftKings" },
            moneyline: {
              away: { close: { odds: "+171" } },
              home: { close: { odds: "-209" } },
            },
          },
        ],
      },
    ],
  });

  assert.ok(event);
  assert.equal(event.id, "espn-mlb-odds:401815812");
  assert.equal(event.name, "Chicago White Sox @ Detroit Tigers");
  assert.equal(event.venue, "Comerica Park");
  assert.equal(event.status, "upcoming");
  assert.equal(event.clock, "6:40 PM EDT");
  assert.equal(event.source, "espn-mlb-odds");
  assert.equal(event.awayLogo, "https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/chw.png");
  assert.equal(event.runners[0]?.name, "Chicago White Sox");
  assert.equal(event.runners[0]?.bestBookmaker, "DraftKings");
  assert.equal(event.runners[0]?.bestPrice, 2.71);
  assert.equal(event.runners[1]?.name, "Detroit Tigers");
  assert.equal(event.runners[1]?.bestPrice, 1.478);
});

test("normalizes ESPN MLB scoreboard payload", () => {
  const events = normalizeEspnMlbScoreboard({
    events: [
      {
        id: "1",
        date: "2026-06-19T23:05Z",
        competitions: [
          {
            competitors: [
              { homeAway: "away", team: { displayName: "Cincinnati Reds" } },
              { homeAway: "home", team: { displayName: "New York Yankees" } },
            ],
            status: { type: { state: "pre" } },
          },
        ],
      },
    ],
  });

  assert.equal(events.length, 1);
  assert.equal(events[0]?.id, "espn-mlb-odds:1");
});
