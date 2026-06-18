import type { SportKey } from "@bettin2win/types";
import type { SportAdapter } from "./base.js";
import { TheOddsApiAdapter } from "./the-odds-api.adapter.js";
import { TheRundownAdapter } from "./therundown.adapter.js";
import { RacingApiAdapter } from "./racing-api.adapter.js";
import { BetsApiAdapter } from "./betsapi.adapter.js";
import { BetMinerAdapter } from "./betminer.adapter.js";

/** Registry mapping each sport to the adapter that owns it. */
export const adapters: Record<SportKey, SportAdapter> = {
  football: new TheOddsApiAdapter("football"),
  baseball: new TheOddsApiAdapter("baseball"),
  soccer: new BetMinerAdapter(),
  nascar: new TheRundownAdapter(),
  "horse-racing": new RacingApiAdapter(),
  greyhound: new BetsApiAdapter(),
};

export type { SportAdapter } from "./base.js";
