import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeStandings } from "./normalize.js";

// NFL-style: nested `team` object + `statistics[]{displayName,value}`
const NFL_BODY = {
  data: [
    {
      leagueName: "American Football Conference",
      data: [
        {
          team: { id: 92764, logo: "x.png", name: "Broncos", displayName: "Denver Broncos", abbreviation: "DEN" },
          statistics: [
            { displayName: "Wins", value: "3" },
            { displayName: "Losses", value: "0" },
            { displayName: "Streak", value: "W3" },
          ],
        },
      ],
    },
  ],
};

// MLB-style: flat team fields + `stats[]{abbreviation,displayValue}`
const MLB_BODY = {
  data: [
    {
      leagueName: "American League (MLB)",
      data: [
        {
          id: 10291180,
          logo: "y.png",
          name: "Orioles",
          stats: [
            { description: "Wins", abbreviation: "W", displayValue: "101" },
            { description: "Losses", abbreviation: "L", displayValue: "61" },
          ],
        },
      ],
    },
  ],
};

test("normalizes NFL nested-team shape", () => {
  const rows = normalizeStandings(NFL_BODY);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.name, "Denver Broncos");
  assert.equal(rows[0]?.abbreviation, "DEN");
  assert.equal(rows[0]?.wins, 3);
  assert.equal(rows[0]?.losses, 0);
  assert.equal(rows[0]?.group, "American Football Conference");
});

test("normalizes MLB flat shape via abbreviations", () => {
  const rows = normalizeStandings(MLB_BODY);
  assert.equal(rows[0]?.name, "Orioles");
  assert.equal(rows[0]?.wins, 101);
  assert.equal(rows[0]?.losses, 61);
});

// NBA-style: top-level `groups[].standings[]` with direct integer wins/loses
const NBA_BODY = {
  groups: [
    {
      name: "Western Conference",
      standings: [
        { team: { id: 118222, logo: "z.png", name: "Dallas Mavericks" }, wins: 50, loses: 32 },
      ],
    },
  ],
};

test("normalizes NBA groups/standings shape with direct integers", () => {
  const rows = normalizeStandings(NBA_BODY);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.name, "Dallas Mavericks");
  assert.equal(rows[0]?.wins, 50);
  assert.equal(rows[0]?.losses, 32);
  assert.equal(rows[0]?.group, "Western Conference");
});

// NHL uses the same groups/standings shape as NBA (hockey)
const NHL_BODY = {
  groups: [
    {
      name: "Western Conference",
      standings: [
        { team: { id: 599888, logo: "j.png", name: "Winnipeg Jets" }, wins: 43, loses: 22 },
      ],
    },
  ],
};

test("normalizes NHL hockey standings", () => {
  const rows = normalizeStandings(NHL_BODY);
  assert.equal(rows[0]?.name, "Winnipeg Jets");
  assert.equal(rows[0]?.wins, 43);
  assert.equal(rows[0]?.losses, 22);
});

test("tolerates garbage input", () => {
  assert.deepEqual(normalizeStandings(null), []);
  assert.deepEqual(normalizeStandings({ data: "nope" }), []);
});
