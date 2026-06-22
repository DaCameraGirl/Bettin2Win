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

/** Try a real backup provider before allowing a primary adapter's mock fallback. */
export class FallbackAdapter implements SportAdapter {
  readonly sport: SportKey;
  readonly provider: string;

  constructor(
    private readonly primary: SportAdapter,
    private readonly backup: SportAdapter,
  ) {
    this.sport = primary.sport;
    this.provider = `${primary.provider}+${backup.provider}`;
  }

  hasCredentials(): boolean {
    return this.primary.hasCredentials() || this.backup.hasCredentials();
  }

  async fetchEvents(): Promise<AdapterResult> {
    const primary = await this.primary.fetchEvents();
    if (primaryHasPricedLiveEvents(primary)) return primary;

    const backup = await this.backup.fetchEvents();
    if (backupHasPricedLiveEvents(backup)) {
      return {
        mode: "live",
        events: backup.events,
        message: formatBackupMessage(this.primary.provider, primary, this.backup.provider, backup),
      };
    }

    if (primary.mode === "live" && primary.events.length > 0) {
      return {
        mode: "live",
        events: primary.events,
        message: primary.message,
      };
    }

    if (backup.mode === "live") {
      return {
        mode: "live",
        events: backup.events,
        message: formatBackupMessage(this.primary.provider, primary, this.backup.provider, backup),
      };
    }

    if (primary.mode === "live") {
      return {
        mode: "live",
        events: primary.events,
        message: `${this.primary.provider} returned no events; backup ${this.backup.provider}: ${backup.message ?? "unavailable"}`,
      };
    }

    return {
      mode: primary.mode,
      events: primary.events,
      message: `${primary.message ?? this.primary.provider}; backup ${this.backup.provider}: ${backup.message ?? "unavailable"}`,
    };
  }
}

function primaryHasPricedLiveEvents(result: AdapterResult): boolean {
  return result.mode === "live" && result.events.length > 0 && hasPricedEvents(result.events);
}

function backupHasPricedLiveEvents(result: AdapterResult): boolean {
  return result.mode === "live" && result.events.length > 0 && hasPricedEvents(result.events);
}

function hasPricedEvents(events: SportEvent[]): boolean {
  return events.some((event) =>
    event.runners.some((runner) => runner.odds.length > 0 || runner.bestPrice !== undefined),
  );
}

function formatBackupMessage(
  primaryProvider: string,
  primary: AdapterResult,
  backupProvider: string,
  backup: AdapterResult,
): string {
  const primaryNote = primary.message ?? (primary.events.length > 0 ? "no priced events" : "no live events");
  const backupNote = backup.message ? ` - ${backup.message}` : "";
  return `${primaryProvider} unavailable (${primaryNote}); backup ${backupProvider}${backupNote}`;
}

/** Helper so adapters compute best price + implied probability consistently. */
export function decorateRunners(event: SportEvent): SportEvent {
  for (const runner of event.runners) {
    let best = -Infinity;
    for (const line of runner.odds) {
      line.impliedProbability = line.price > 0 ? 1 / line.price : 0;
      if (line.price > 0 && line.price > best) {
        best = line.price;
        runner.bestBookmaker = line.bookmaker;
      }
    }
    runner.bestPrice = Number.isFinite(best) && best > 0 ? best : undefined;
  }
  return event;
}
