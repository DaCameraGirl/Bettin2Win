import type { SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { BetMinerAdapter } from "./betminer.adapter.js";
import { EspnSoccerScoreboardAdapter } from "./espn-soccer-scoreboard.adapter.js";
import { mergeSoccerEvents } from "./soccer-merge.js";

/**
 * Keeps BetMiner predictions when available, but always folds in ESPN prices so
 * soccer still has real odds when BetMiner is rate-limited.
 */
export class SoccerCompositeAdapter implements SportAdapter {
  readonly sport = "soccer" as const;
  readonly provider = "betminer+espn-soccer-odds";

  private readonly betminer = new BetMinerAdapter();
  private readonly espn = new EspnSoccerScoreboardAdapter();

  hasCredentials(): boolean {
    return this.betminer.hasCredentials() || this.espn.hasCredentials();
  }

  async fetchEvents(): Promise<AdapterResult> {
    const [betminer, espn] = await Promise.all([
      this.betminer.fetchEvents(),
      this.espn.fetchEvents(),
    ]);

    const priced = espn.events.map((event) => decorateRunners(event));
    const primary = betminer.events.length > 0 ? betminer.events : priced;
    const events = mergeSoccerEvents(primary, priced);
    const withOdds = events.filter((event) =>
      event.runners.some((runner) => runner.odds.length > 0 || runner.bestPrice !== undefined),
    ).length;

    if (events.length === 0) {
      return {
        mode: "live",
        events,
        message: composeMessage(betminer, espn, 0, 0),
      };
    }

    return {
      mode: "live",
      events,
      message: composeMessage(betminer, espn, events.length, withOdds),
    };
  }
}

function composeMessage(
  betminer: AdapterResult,
  espn: AdapterResult,
  total: number,
  priced: number,
): string {
  const notes = [
    betminer.message ? `betminer: ${betminer.message}` : "",
    espn.message ? `espn: ${espn.message}` : "",
  ].filter(Boolean);

  const oddsNote = priced > 0
    ? `${priced}/${total} matches with prices`
    : "matches listed, odds limited right now";

  return notes.length > 0 ? `${notes.join("; ")}; merged ${oddsNote}` : `merged ${oddsNote}`;
}