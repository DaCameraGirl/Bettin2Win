import type { SportKey } from "@bettin2win/types";
import { FallbackAdapter, type SportAdapter } from "./base.js";
import { TheOddsApiAdapter } from "./the-odds-api.adapter.js";
import { TheRundownAdapter } from "./therundown.adapter.js";
import { RacingApiAdapter } from "./racing-api.adapter.js";
import { HorseRacingRapidApiAdapter } from "./horse-racing-rapidapi.adapter.js";
import { BetsApiAdapter } from "./betsapi.adapter.js";
import { BetMinerAdapter } from "./betminer.adapter.js";
import { FootballPredictionAdapter } from "./football-prediction.adapter.js";
import { HighlightlyMatchesAdapter } from "./highlightly-matches.adapter.js";
import { SportsbookAdvantagesAdapter } from "./sportsbook-advantages.adapter.js";
import { Tank01MlbAdapter } from "./tank01-mlb.adapter.js";
import { MlbStatsAdapter } from "./mlb-stats.adapter.js";
import { EspnGolfAdapter } from "./espn-golf.adapter.js";
import { EspnMlbOddsAdapter } from "./espn-mlb-odds.adapter.js";
import { EspnNhlOddsAdapter } from "./espn-nhl-odds.adapter.js";
import { EspnNascarAdapter } from "./espn-nascar.adapter.js";
import { GreyhoundRacingUkAdapter } from "./greyhound-racing-uk.adapter.js";
import { NhlScoreboardAdapter } from "./nhl-scoreboard.adapter.js";
import { EspnNflScoreboardAdapter } from "./espn-nfl-scoreboard.adapter.js";
import { EspnSoccerScoreboardAdapter } from "./espn-soccer-scoreboard.adapter.js";

/** Registry mapping each sport to the adapter that owns it. */
export const adapters: Record<SportKey, SportAdapter> = {
  football: new FallbackAdapter(
    new FallbackAdapter(
      new TheOddsApiAdapter("football"),
      new SportsbookAdvantagesAdapter("football"),
    ),
    new FallbackAdapter(new HighlightlyMatchesAdapter("football"), new EspnNflScoreboardAdapter()),
  ),
  baseball: new FallbackAdapter(
    new FallbackAdapter(
      new FallbackAdapter(new TheOddsApiAdapter("baseball"), new Tank01MlbAdapter()),
      new HighlightlyMatchesAdapter("baseball"),
    ),
    new FallbackAdapter(new EspnMlbOddsAdapter(), new MlbStatsAdapter()),
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
      new FallbackAdapter(
        new TheOddsApiAdapter("hockey"),
        new SportsbookAdvantagesAdapter("hockey"),
      ),
      new HighlightlyMatchesAdapter("hockey"),
    ),
    new FallbackAdapter(new EspnNhlOddsAdapter(), new NhlScoreboardAdapter()),
  ),
  soccer: new FallbackAdapter(
    new FallbackAdapter(new BetMinerAdapter(), new FootballPredictionAdapter()),
    new EspnSoccerScoreboardAdapter(),
  ),
  golf: new EspnGolfAdapter(),
  nascar: new FallbackAdapter(new EspnNascarAdapter(), new TheRundownAdapter()),
  "horse-racing": new FallbackAdapter(
    new HorseRacingRapidApiAdapter(),
    new RacingApiAdapter(),
  ),
  greyhound: new FallbackAdapter(new GreyhoundRacingUkAdapter(), new BetsApiAdapter()),
};

export type { SportAdapter } from "./base.js";
