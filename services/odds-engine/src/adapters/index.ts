import type { SportKey } from "@bettin2win/types";
import { FallbackAdapter, type SportAdapter } from "./base.js";
import { TheOddsApiAdapter } from "./the-odds-api.adapter.js";
import { TheRundownAdapter } from "./therundown.adapter.js";
import { RacingApiAdapter } from "./racing-api.adapter.js";
import { BetsApiAdapter } from "./betsapi.adapter.js";
import { BetMinerAdapter } from "./betminer.adapter.js";
import { FootballPredictionAdapter } from "./football-prediction.adapter.js";
import { HighlightlyMatchesAdapter } from "./highlightly-matches.adapter.js";
import { SportsbookAdvantagesAdapter } from "./sportsbook-advantages.adapter.js";
import { Tank01MlbAdapter } from "./tank01-mlb.adapter.js";

/** Registry mapping each sport to the adapter that owns it. */
export const adapters: Record<SportKey, SportAdapter> = {
  football: new FallbackAdapter(
    new FallbackAdapter(
      new TheOddsApiAdapter("football"),
      new SportsbookAdvantagesAdapter("football"),
    ),
    new HighlightlyMatchesAdapter("football"),
  ),
  baseball: new FallbackAdapter(
    new FallbackAdapter(new TheOddsApiAdapter("baseball"), new Tank01MlbAdapter()),
    new HighlightlyMatchesAdapter("baseball"),
  ),
  basketball: new FallbackAdapter(
    new FallbackAdapter(
      new TheOddsApiAdapter("basketball"),
      new SportsbookAdvantagesAdapter("basketball"),
    ),
    new HighlightlyMatchesAdapter("basketball"),
  ),
  hockey: new FallbackAdapter(
    new FallbackAdapter(
      new TheOddsApiAdapter("hockey"),
      new SportsbookAdvantagesAdapter("hockey"),
    ),
    new HighlightlyMatchesAdapter("hockey"),
  ),
  soccer: new FallbackAdapter(new BetMinerAdapter(), new FootballPredictionAdapter()),
  nascar: new TheRundownAdapter(),
  "horse-racing": new RacingApiAdapter(),
  greyhound: new BetsApiAdapter(),
};

export type { SportAdapter } from "./base.js";
