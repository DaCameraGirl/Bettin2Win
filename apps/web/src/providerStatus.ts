import type { ProviderHealth, SportEvent } from "@bettin2win/types";

export type FeedStatus =
  | "live-odds"
  | "real-game-feed"
  | "demo"
  | "no-key"
  | "quota-hit"
  | "provider-down"
  | "waiting";

export const FEED_STATUS_LABELS: Record<FeedStatus, string> = {
  "live-odds": "Live odds",
  "real-game-feed": "Real game feed",
  demo: "Demo",
  "no-key": "No key",
  "quota-hit": "Quota hit",
  "provider-down": "Provider down",
  waiting: "Waiting",
};

export function eventHasOdds(event: SportEvent): boolean {
  return event.runners.some((runner) => runner.odds.length > 0 || runner.bestPrice !== undefined);
}

export function sportHasOdds(events: SportEvent[]): boolean {
  return events.some(eventHasOdds);
}

export function classifyFeedStatus(
  health: ProviderHealth | undefined,
  events: SportEvent[],
  forceDemo = false,
): FeedStatus {
  if (forceDemo) return "demo";
  if (!health) return events.length > 0 ? (sportHasOdds(events) ? "live-odds" : "real-game-feed") : "waiting";

  const message = (health.message ?? "").toLowerCase();

  if (health.mode === "mock") {
    if (
      /no [\w_]*key|no rapidapi|no odds_api|no betsapi|no therundown|subscribe to/.test(message)
    ) {
      return "no-key";
    }
    return "demo";
  }

  if (/429|quota|rate.?limit|daily budget|out of daily|rate-limited/.test(message)) {
    return "quota-hit";
  }

  if (!health.ok || /provider 401|provider 403|provider 5\d\d|unavailable|fetch failed/.test(message)) {
    return "provider-down";
  }

  if (sportHasOdds(events)) return "live-odds";
  if (events.length > 0) return "real-game-feed";
  return "waiting";
}

export function feedLabelFromStatus(status: FeedStatus): string {
  return FEED_STATUS_LABELS[status].toUpperCase();
}