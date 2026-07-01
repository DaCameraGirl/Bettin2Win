import type { SportEvent } from "@bettin2win/types";

const SOURCE_LABELS: Record<string, string> = {
  "the-odds-api": "The Odds API",
  "sportsbook-api": "Sportsbook API",
  "espn-nfl-odds": "ESPN",
  "espn-mlb-odds": "ESPN",
  "espn-nba-odds": "ESPN",
  "espn-nhl-odds": "ESPN",
  "espn-soccer-odds": "ESPN",
  "espn-golf": "ESPN",
  "espn-nascar": "ESPN",
  "nhl-scoreboard": "NHL.com",
  "tank01-mlb": "Tank01",
  "mlb-stats": "MLB Stats",
  betminer: "BetMiner",
  "football-prediction-api": "Football Prediction API",
  "horse-racing-rapidapi": "Horse Racing API",
  "racing-api": "The Racing API",
  "greyhound-racing-uk": "Greyhound Racing UK",
  "gbgb-rss": "GBGB",
  betsapi: "BetsAPI",
  therundown: "TheRundown",
  demo: "Sample data",
  mock: "Sample data",
};

export function isSampleEvent(event: SportEvent): boolean {
  return event.source === "demo" || event.source === "mock" || event.id.startsWith("demo-") || event.id.startsWith("mock-");
}

export function dataSourceLabel(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "Live feed";
  return SOURCE_LABELS[trimmed] ?? formatUnknownSource(trimmed);
}

function formatUnknownSource(source: string): string {
  return source
    .split(/[-_+]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}