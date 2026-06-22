import type { SportEvent } from "@bettin2win/types";
import { decorateRunners, type AdapterResult, type SportAdapter } from "./base.js";
import { EspnNhlOddsAdapter } from "./espn-nhl-odds.adapter.js";
import { NhlScoreboardAdapter } from "./nhl-scoreboard.adapter.js";
import { mergeNhlEvents } from "./nhl-merge.js";

/**
 * Combines the official NHL scoreboard (live scores, final status) with ESPN
 * moneyline prices when ESPN exposes them.
 */
export class NhlCompositeAdapter implements SportAdapter {
  readonly sport = "hockey" as const;
  readonly provider = "espn-nhl-odds+nhl-scoreboard";

  private readonly espn = new EspnNhlOddsAdapter();
  private readonly scoreboard = new NhlScoreboardAdapter();

  hasCredentials(): boolean {
    return true;
  }

  async fetchEvents(): Promise<AdapterResult> {
    const [espn, scoreboard] = await Promise.all([
      this.espn.fetchEvents(),
      this.scoreboard.fetchEvents(),
    ]);

    const events = mergeNhlEvents(espn.events, scoreboard.events).map((event) => decorateRunners(event));
    const priced = events.filter((event) =>
      event.runners.some((runner) => runner.odds.length > 0 || runner.bestPrice !== undefined),
    ).length;

    if (events.length === 0) {
      return {
        mode: "live",
        events,
        message: "0 NHL games in ESPN or official scoreboard window",
      };
    }

    if (priced > 0) {
      return {
        mode: "live",
        events,
        message: `${priced}/${events.length} NHL games with ESPN moneyline odds`,
      };
    }

    return {
      mode: "live",
      events,
      message: `${events.length} real NHL game${events.length === 1 ? "" : "s"} (odds unavailable)`,
    };
  }
}