import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeYahooChart } from "./market-ticker.js";

test("normalizes Yahoo Finance chart quote", () => {
  const quote = normalizeYahooChart("SPY", "S&P 500", {
    chart: {
      result: [
        {
          meta: {
            currency: "USD",
            symbol: "SPY",
            regularMarketPrice: 744.48,
            chartPreviousClose: 746.74,
            regularMarketTime: 1782143380,
            marketState: "REGULAR",
          },
        },
      ],
    },
  });

  assert.ok(quote);
  assert.equal(quote.symbol, "SPY");
  assert.equal(quote.label, "S&P 500");
  assert.equal(quote.price, 744.48);
  assert.equal(quote.change, -2.26);
  assert.ok(Math.abs(quote.changePercent - -0.3026) < 0.01);
  assert.equal(quote.currency, "USD");
  assert.equal(quote.marketState, "REGULAR");
});