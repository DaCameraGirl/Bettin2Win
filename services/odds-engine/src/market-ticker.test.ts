import { test } from "node:test";
import assert from "node:assert/strict";
import { TICKER_WATCHLIST } from "./market-watchlist.js";
import { normalizeYahooChart } from "./market-ticker.js";

test("watchlist includes expanded default symbols", () => {
  const symbols = new Set(TICKER_WATCHLIST.map((entry) => entry.symbol));
  for (const symbol of ["IWM", "PLTR", "COIN", "HOOD", "TQQQ", "GLD", "AMD", "VOO"]) {
    assert.ok(symbols.has(symbol), `missing ${symbol}`);
  }
  assert.equal(TICKER_WATCHLIST.length, 46);
});

test("normalizes Yahoo Finance chart quote with category", () => {
  const entry = TICKER_WATCHLIST.find((row) => row.symbol === "SPY");
  assert.ok(entry);

  const quote = normalizeYahooChart(entry, {
    chart: {
      result: [
        {
          meta: {
            currency: "USD",
            symbol: "SPY",
            shortName: "SPDR S&P 500",
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
  assert.equal(quote.label, "SPDR S&P 500");
  assert.equal(quote.category, "indexes");
  assert.equal(quote.price, 744.48);
  assert.equal(quote.change, -2.26);
  assert.ok(Math.abs(quote.changePercent - -0.3) < 0.05);
});