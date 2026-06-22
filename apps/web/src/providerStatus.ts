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

export function isEngineMockBoard(events: SportEvent[]): boolean {
  return (
    events.length > 0 &&
    events.every((event) => event.source === "mock" || event.id.startsWith("mock-"))
  );
}

/** The tail of a fallback chain — what the engine is actually serving now. */
export function activeFeedNote(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/;\s*backup\s+/i);
  const tail = parts[parts.length - 1]?.trim() ?? trimmed;
  const dash = tail.indexOf(" - ");
  return dash >= 0 ? tail.slice(dash + 3).trim() : tail;
}

function statusFromActiveFeed(note: string): FeedStatus | null {
  const text = note.toLowerCase();
  if (!text) return null;

  if (/no [\w_]*key|no rapidapi|no betsapi|no therundown|subscribe to/.test(text)) {
    return "no-key";
  }
  if (
    /\d+\/\d+.*\bodds\b|sportsbook opportunities|moneyline odds|with draftkings/.test(text)
  ) {
    return "live-odds";
  }
  if (
    /\d+\s+real\b|leaderboard from espn|from espn|racecards live|nascar cup race/.test(text)
  ) {
    return "real-game-feed";
  }
  if (/429|quota|rate.?limit|daily budget|out of daily|rate-limited/.test(text)) {
    return "quota-hit";
  }
  if (/provider 401|provider 403|provider 5\d\d|unavailable|fetch failed|unreachable/.test(text)) {
    return "provider-down";
  }
  return null;
}

function statusFromHealthMessage(message: string): FeedStatus | null {
  const active = activeFeedNote(message);
  const activeStatus = statusFromActiveFeed(active);
  if (activeStatus) return activeStatus;

  const text = message.toLowerCase();
  if (/no [\w_]*key|no rapidapi|no odds_api|no betsapi|no therundown|subscribe to/.test(text)) {
    return "no-key";
  }
  if (/429|quota|rate.?limit|daily budget|out of daily|rate-limited/.test(text)) {
    return "quota-hit";
  }
  if (/provider 401|provider 403|provider 5\d\d|unavailable|fetch failed|unreachable/.test(text)) {
    return "provider-down";
  }
  return null;
}

export function classifyFeedStatus(
  health: ProviderHealth | undefined,
  events: SportEvent[],
  forceDemo = false,
): FeedStatus {
  if (forceDemo) return "demo";

  if (events.length > 0 && !isEngineMockBoard(events)) {
    return sportHasOdds(events) ? "live-odds" : "real-game-feed";
  }

  const message = health?.message ?? "";

  if (health?.mode === "live" && health.ok && message) {
    const activeStatus = statusFromActiveFeed(activeFeedNote(message));
    if (activeStatus && activeStatus !== "provider-down" && activeStatus !== "quota-hit") {
      return activeStatus;
    }
  }

  if (sportHasOdds(events)) return "live-odds";

  const messageStatus = message ? statusFromHealthMessage(message) : null;

  if (messageStatus) return messageStatus;
  if (health && !health.ok) return "provider-down";
  if (!health) return "waiting";
  if (health.mode === "mock") return messageStatus ?? "provider-down";
  return "waiting";
}

export function feedLabelFromStatus(status: FeedStatus): string {
  return FEED_STATUS_LABELS[status].toUpperCase();
}

/** User-facing one-liner for a working feed (green cards). */
export function feedSummaryFromHealth(
  health: ProviderHealth | undefined,
  eventCount: number,
): string {
  const note = activeFeedNote(health?.message ?? "");
  if (note) return note.length > 84 ? `${note.slice(0, 81)}…` : note;
  return `${eventCount} event${eventCount === 1 ? "" : "s"}`;
}