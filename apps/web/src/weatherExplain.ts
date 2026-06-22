import type { SportEvent, SportKey, WeatherBadgeKind, WeatherImpact, WeatherImpactLevel } from "@bettin2win/types";

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
    summary: "Weather is unlikely to affect play.",
    headline: "Indoor venue",
    whyItMatters:
      "This game is played in an indoor arena, so rain, wind, and heat usually do not change how the game is played.",
  };
}

export function weatherImpactCardLabel(
  impact: WeatherImpact,
  sport: SportKey,
): { kicker: string; level: string } {
  if (impact.badges.includes("indoor-venue")) {
    return { kicker: "Weather Impact", level: "Indoor venue" };
  }
  if ((sport === "horse-racing" || sport === "greyhound") && impact.trackCondition) {
    const muddy = /muddy|soft/i.test(impact.trackCondition);
    const damp = /damp/i.test(impact.trackCondition);
    const condition = muddy ? "Muddy" : damp ? "Damp" : "Dry";
    return { kicker: "Track Condition", level: condition };
  }
  return { kicker: "Weather Impact", level: impactLevelLabel(impact.impactLevel) };
}

const DEMO_WEATHER_BY_EVENT_ID: Record<string, Omit<WeatherImpact, "eventId">> = {
  "demo-football-0": {
    impactLevel: "medium",
    badges: ["wind-alert", "rain-risk"],
    summary: "Wind 18 mph · Rain likely",
    headline: "Weather Impact: Medium",
    whyItMatters:
      "Wind can make long passes, kicks, and fly balls less predictable. Rain may slow the field and increase handling mistakes.",
    windMph: 18,
    precipitationChance: 55,
  },
  "demo-football-1": {
    impactLevel: "low",
    badges: [],
    summary: "48°F · Light breeze",
    headline: "Weather Impact: Low",
    whyItMatters:
      "Outdoor conditions look fairly normal. Weather is unlikely to be the main story for this game.",
    temperatureF: 48,
    windMph: 6,
  },
  "demo-football-2": {
    impactLevel: "high",
    badges: ["heat-alert", "wind-alert"],
    summary: "96°F · Wind 22 mph",
    headline: "Weather Impact: High",
    whyItMatters:
      "Extreme heat can increase fatigue, especially late in the game. Strong wind can make kicks and deep passes harder to control.",
    temperatureF: 96,
    windMph: 22,
  },
  "demo-baseball-0": {
    impactLevel: "medium",
    badges: ["rain-risk", "wind-alert"],
    summary: "62°F · Wind 14 mph · Rain possible",
    headline: "Weather Impact: Medium",
    whyItMatters:
      "Wind can push fly balls farther or knock them down. Rain delays are common and wet conditions can lower scoring.",
    temperatureF: 62,
    windMph: 14,
    precipitationChance: 40,
  },
  "demo-baseball-1": {
    impactLevel: "low",
    badges: [],
    summary: "72°F · Clear skies",
    headline: "Weather Impact: Low",
    whyItMatters:
      "Outdoor conditions look fairly normal. Weather is unlikely to be the main story for this game.",
    temperatureF: 72,
  },
  "demo-soccer-0": {
    impactLevel: "medium",
    badges: ["wind-alert"],
    summary: "Wind 16 mph · Overcast",
    headline: "Weather Impact: Medium",
    whyItMatters:
      "Wind can change long balls, corners, and shot accuracy on an open pitch.",
    windMph: 16,
  },
  "demo-golf-0": {
    impactLevel: "high",
    badges: ["wind-alert"],
    summary: "Wind 24 mph · Partly cloudy",
    headline: "Weather Impact: High",
    whyItMatters:
      "Wind is huge in golf — it changes club selection and makes scoring harder on long holes.",
    windMph: 24,
  },
  "demo-nascar-0": {
    impactLevel: "medium",
    badges: ["rain-risk"],
    summary: "78°F · Rain possible · Delay possible",
    headline: "Weather Impact: Medium",
    whyItMatters:
      "Rain can pause or shorten a race, changing strategy and which cars look strongest in wet conditions.",
    temperatureF: 78,
    precipitationChance: 45,
  },
  "demo-horse-racing-0": {
    impactLevel: "medium",
    badges: ["rain-risk", "track-condition"],
    summary: "Rain earlier today",
    headline: "Track Condition: Muddy",
    whyItMatters:
      "Wet tracks can change traction and favor runners that handle softer surfaces.",
    trackCondition: "Muddy",
    precipitationChance: 60,
  },
  "demo-greyhound-0": {
    impactLevel: "medium",
    badges: ["rain-risk", "track-condition"],
    summary: "Rain earlier today",
    headline: "Track Condition: Muddy",
    whyItMatters:
      "Wet tracks can change traction and favor runners that handle softer surfaces.",
    trackCondition: "Muddy",
    precipitationChance: 62,
  },
};

export function demoWeatherImpactForEvent(event: SportEvent): WeatherImpact | null {
  if (!WEATHER_SPORTS.includes(event.sport)) return null;

  if (event.sport === "basketball" || event.sport === "hockey") {
    return indoorWeatherImpact(event.id);
  }

  const preset = DEMO_WEATHER_BY_EVENT_ID[event.id];
  if (preset) return { ...preset, eventId: event.id };

  return {
    eventId: event.id,
    impactLevel: "low",
    badges: [],
    summary: "Mild outdoor conditions",
    headline: "Weather Impact: Low",
    whyItMatters:
      "Outdoor conditions look fairly normal. Weather is unlikely to be the main story for this game.",
  };
}

export function buildDemoWeatherImpacts(events: SportEvent[]): Record<string, WeatherImpact> {
  const impacts: Record<string, WeatherImpact> = {};
  for (const event of events) {
    const impact = demoWeatherImpactForEvent(event);
    if (impact) impacts[event.id] = impact;
  }
  return impacts;
}