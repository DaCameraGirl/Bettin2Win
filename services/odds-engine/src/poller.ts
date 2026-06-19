import type {
  ProviderHealth,
  SportEvent,
  SportKey,
  WebSocketMessage,
} from "@bettin2win/types";
import { ALL_SPORTS, SPORTS } from "./config.js";
import { adapters } from "./adapters/index.js";
import { detectMovements } from "./movement.js";
import { lineHistoryStore, type LineHistoryStore } from "./line-history.js";

type Emit = (message: WebSocketMessage) => void;

/**
 * Drives one polling loop per sport at its configured interval, diffs each
 * result against the last snapshot, and emits snapshot / movement / health
 * messages through the provided sink.
 */
export class Poller {
  private timers: NodeJS.Timeout[] = [];
  private lastEvents = new Map<string, SportEvent>();
  private health = new Map<SportKey, ProviderHealth>();

  constructor(
    private readonly emit: Emit,
    private readonly lineHistory: LineHistoryStore = lineHistoryStore,
  ) {}

  start(): void {
    for (const sport of ALL_SPORTS) {
      void this.poll(sport);
      const timer = setInterval(() => void this.poll(sport), SPORTS[sport].pollIntervalMs);
      this.timers.push(timer);
    }
  }

  stop(): void {
    for (const timer of this.timers) clearInterval(timer);
    this.timers = [];
  }

  /** Latest cached events for a sport (used to seed new WebSocket clients). */
  snapshot(sport: SportKey): SportEvent[] {
    return [...this.lastEvents.values()].filter((e) => e.sport === sport);
  }

  healthReport(): ProviderHealth[] {
    return [...this.health.values()];
  }

  private async poll(sport: SportKey): Promise<void> {
    const adapter = adapters[sport];
    const result = await adapter.fetchEvents();
    const events = result.events.map((event) => this.lineHistory.decorate(event));

    this.health.set(sport, {
      provider: adapter.provider,
      sport,
      ok: result.mode === "live" || result.message?.includes("OK") === true,
      mode: result.mode,
      lastChecked: new Date().toISOString(),
      message: result.message,
    });

    const currentIds = new Set(events.map((event) => event.id));
    for (const [id, event] of this.lastEvents) {
      if (event.sport === sport && !currentIds.has(id)) {
        this.lastEvents.delete(id);
      }
    }

    for (const event of events) {
      const previous = this.lastEvents.get(event.id);
      const movements = detectMovements(previous, event);
      this.lastEvents.set(event.id, event);
      this.emit({ type: "odds_update", event });
      for (const movement of movements) this.emit({ type: "movement", movement });
    }

    this.emit({ type: "snapshot", sport, events: this.snapshot(sport) });
    this.emit({ type: "health", providers: this.healthReport() });
  }
}
