import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeBetMinerMatch } from "./betminer.adapter.js";

const RAW_MATCH = {
  match_id: 12345,
  kickoff: "2026-06-17T19:00:00Z",
  status: "FT",
  minute: 90,
  home_team: { id: 1, name: "River Plate", slug: "river-plate", logo: "home.png" },
  away_team: { id: 2, name: "Boca Juniors", slug: "boca-juniors", logo: "away.png" },
  competition: { name: "Primera Division", country: "Argentina", country_code: "AR" },
  score: { home: 2, away: 1, ht_home: 1, ht_away: 0 },
  probabilities: { home_win: 73, draw: 18, away_win: 9, btts: 64, over_25: 57 },
  predictions: {
    result: "home_win",
    correct_score: "2-1",
    htft: "1/1",
    btts: "yes",
    over_25: "over",
  },
  odds: { home_win: "1.80", draw: "3.60", away_win: "4.50", dc_1x: "1.22" },
  form: { home: "WDWLL", away: "LLDLL", home_btts: 4, away_btts: 3 },
};

test("normalizes BetMiner soccer match details", () => {
  const event = normalizeBetMinerMatch(RAW_MATCH, "2026-06-17T18:00:00Z");

  assert.ok(event);
  assert.equal(event.id, "soccer:12345");
  assert.equal(event.name, "Boca Juniors @ River Plate");
  assert.equal(event.status, "finished");
  assert.equal(event.homeLogo, "home.png");
  assert.equal(event.awayLogo, "away.png");
  assert.deepEqual(event.form, { home: "WDWLL", away: "LLDLL" });
  assert.equal(event.venue, "Argentina - Primera Division");

  assert.equal(event.prediction?.pick, "River Plate");
  assert.equal(event.prediction?.pickCode, "1");
  assert.equal(event.prediction?.probability, 73);
  assert.equal(event.prediction?.odds, 1.8);
  assert.equal(event.prediction?.status, "won");
  assert.equal(event.prediction?.result, "1 - 2");
  assert.equal(event.prediction?.correctScore, "1 - 2");
  assert.deepEqual(event.prediction?.extras, ["BTTS Yes", "Over 2.5", "HT/FT 1/1"]);

  assert.equal(event.runners.length, 3);
  assert.equal(event.runners[0]?.name, "River Plate");
  assert.equal(event.runners[0]?.bestPrice, 1.8);
  assert.equal(event.runners[1]?.name, "Draw");
  assert.equal(event.runners[2]?.name, "Boca Juniors");
});

test("falls back to strongest probability when result is missing", () => {
  const event = normalizeBetMinerMatch({
    ...RAW_MATCH,
    status: "NS",
    predictions: {},
    probabilities: { home_win: "31", draw: "22", away_win: "47" },
    score: {},
  });

  assert.equal(event?.status, "upcoming");
  assert.equal(event?.prediction?.pick, "Boca Juniors");
  assert.equal(event?.prediction?.probability, 47);
  assert.equal(event?.prediction?.status, "pending");
  assert.equal(event?.prediction?.result, undefined);
});
