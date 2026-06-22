import type { SportKey, WeatherBadgeKind, WeatherImpact, WeatherImpactLevel } from "@bettin2win/types";

export const WEATHER_SPORTS: SportKey[] = [
  "football",
  "baseball",
  "basketball",
  "hockey",
  "soccer",
  "golf",
  "nascar",
  "horse-racing",
  "greyhound",
];

export const WEATHER_BADGE_LABELS: Record<WeatherBadgeKind, string> = {
  "wind-alert": "Wind Alert",
  "rain-risk": "Rain Risk",
  "heat-alert": "Heat Alert",
  "track-condition": "Track Condition",
  "indoor-venue": "Indoor Venue",
};

export const WEATHER_BADGE_HINTS: Record<WeatherBadgeKind, string> = {
  "wind-alert": "Passing, kicking, or fly balls may be affected",
  "rain-risk": "Slick surface, delay risk, scoring may drop",
  "heat-alert": "Fatigue risk in outdoor endurance sports",
  "track-condition": "Racing surface may change results",
  "indoor-venue": "Weather unlikely to matter",
};

export function impactLevelLabel(level: WeatherImpactLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function indoorWeatherImpact(eventId: string): WeatherImpact {
  return {
    eventId,
    impactLevel: "low",
    badges: ["indoor-venue"],
    summary: "Indoor arena — weather unlikely to matter",
    headline: "Indoor venue",
    whyItMatters:
      "This game is played indoors, so rain, wind, and heat usually do not change how the game is played. " +
      "Focus on the odds and matchup instead of outdoor conditions.",
  };
}