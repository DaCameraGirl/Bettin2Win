import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getShareSiteUrl } from "./siteUrl.js";

describe("getShareSiteUrl", () => {
  it("strips hash and query from the current page", () => {
    assert.equal(
      getShareSiteUrl("https://dacameragirl.github.io/Bettin2Win/?demo=1#football"),
      "https://dacameragirl.github.io/Bettin2Win",
    );
  });

  it("falls back to the public Pages URL when href is empty", () => {
    assert.equal(getShareSiteUrl(""), "https://dacameragirl.github.io/Bettin2Win/");
  });
});