import type { DataMode, SportEvent, SportKey } from "@bettin2win/types";

export interface AdapterResult {
  mode: DataMode;
  events: SportEvent[];
  /** Present when the adapter fell back to mock or hit an error. */
  message?: string;
}

/**
 * Every sport adapter implements this contract. The poller does not care
 * whether the data came from a live feed or the mock generator - it only
 * consumes normalized {@link SportEvent}s.
 */
export interface SportAdapter {
  readonly sport: SportKey;
  readonly provider: string;
  /** True when the credentials required for live mode are present. */
  hasCredentials(): boolean;
  /** Fetch the current set of events. Must never throw; return mock on failure. */
  fetchEvents(): Promise<AdapterResult>;
}

/** Helper so adapters compute best price + implied probability consistently. */
export function decorateRunners(event: SportEvent): SportEvent {
  for (const runner of event.runners) {
    let best = Infinity;
    for (const line of runner.odds) {
      line.impliedProbability = line.price > 0 ? 1 / line.price : 0;
      if (line.price > 0 && line.price < best) best = line.price;
    }
    runner.bestPrice = Number.isFinite(best) ? best : undefined;
  }
  return event;
}
