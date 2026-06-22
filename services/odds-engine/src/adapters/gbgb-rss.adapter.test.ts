import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeGbgbRaceItem, normalizeGbgbRss } from "./gbgb-rss.adapter.js";

test("normalizes GBGB RSS race item with trap runners", () => {
  const event = normalizeGbgbRaceItem({
    title: "Race 6 - Hove 19:48",
    description: "Trap 1 Swift Jet, Trap 2 Bold Lass, Trap 3 Grey Bullet",
    link: "https://www.gbgb.org.uk/race/1",
    pubDate: "Mon, 22 Jun 2026 18:48:00 +0000",
  });

  assert.ok(event);
  assert.equal(event?.sport, "greyhound");
  assert.equal(event?.source, "gbgb-rss");
  assert.equal(event?.name, "Race 6 - Hove 19:48");
  assert.equal(event?.venue, "Hove");
  assert.equal(event?.runners.length, 3);
  assert.equal(event?.runners[0]?.number, 1);
});

test("returns empty list when GBGB RSS channel has no items", () => {
  const events = normalizeGbgbRss(`<?xml version="1.0"?><rss><channel><title>GBGB</title></channel></rss>`);
  assert.deepEqual(events, []);
});