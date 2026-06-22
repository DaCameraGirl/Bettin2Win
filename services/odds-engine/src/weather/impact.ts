import type { SportEvent, SportKey, WeatherBadgeKind, WeatherImpact, WeatherImpactLevel } from "@bettin2win/types";
import { fetchHourlyForecast, geocodePlace, type HourlyWeather } from "./open-meteo.js";

const OUTDOOR_SPORTS: SportKey[] = [
  "football",
  "baseball",
  "soccer",
  "golf",
  "nascar",
  "horse-racing",
  "greyhound",
];

const INDOOR_SPORTS: SportKey[] = ["basketball", "hockey"];

const LEAGUE_VENUES = new Set([
  "Premier League",
  "MLS",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "NBA",
  "WNBA",
  "NCAAM",
]);

const geoCache = new Map<string, { lat: number; lon: number; expires: number }>();
const forecastCache = new Map<string, { reading: HourlyWeather; expires: number }>();

const GEO_TTL_MS = 7 * 24 * 60 * 60_000;
const FORECAST_TTL_MS = 30 * 60_000;
const MAX_EVENTS_PER_REQUEST = 10;

export function isWeatherSport(sport: SportKey): boolean {
  return OUTDOOR_SPORTS.includes(sport) || INDOOR_SPORTS.includes(sport);
}

export async function buildWeatherImpacts(events: SportEvent[]): Promise<Record<string, WeatherImpact>> {
  const impacts: Record<string, WeatherImpact> = {};
  const targets = events
    .filter((event) => event.status !== "finished")
    .slice(0, MAX_EVENTS_PER_REQUEST);

  await Promise.all(
    targets.map(async (event) => {
      const impact = await weatherImpactForEvent(event);
      if (impact) impacts[event.id] = impact;
    }),
  );

  return impacts;
}

export async function weatherImpactForEvent(event: SportEvent): Promise<WeatherImpact | null> {
  if (INDOOR_SPORTS.includes(event.sport)) {
    return indoorImpact(event);
  }
  if (!OUTDOOR_SPORTS.includes(event.sport)) return null;

  const query = geoQueryForEvent(event);
  if (!query) return null;

  const coords = await cachedGeocode(query);
  if (!coords) return null;

  const reading = await cachedForecast(coords.lat, coords.lon, event.startTime);
  if (!reading) return null;

  return classifyWeatherImpact(event, reading);
}

export function classifyWeatherImpact(event: SportEvent, reading: HourlyWeather): WeatherImpact {
  const badges: WeatherBadgeKind[] = [];
  const tempF = reading.temperatureF;
  const windMph = reading.windMph;
  const precip = reading.precipitationChance;
  const rainy = reading.weatherCode >= 51 && reading.weatherCode <= 99;

  if (windMph >= 12) badges.push("wind-alert");
  if (precip >= 35 || rainy) badges.push("rain-risk");
  if (tempF >= 88) badges.push("heat-alert");
  if (["horse-racing", "greyhound", "golf", "nascar"].includes(event.sport) && (precip >= 40 || rainy)) {
    badges.push("track-condition");
  }

  const trackCondition = trackConditionText(event.sport, precip, rainy);
  const impactLevel = impactLevelFromSignals({ windMph, precip, tempF, rainy, sport: event.sport });
  const summary = buildSummary({ tempF, windMph, precip, rainy, trackCondition, sport: event.sport });
  const headline = headlineForSport(event.sport, impactLevel);
  const whyItMatters = whyItMattersForSport(event.sport, {
    windMph,
    precip,
    tempF,
    rainy,
    trackCondition,
    impactLevel,
  });

  return {
    eventId: event.id,
    impactLevel,
    badges,
    summary,
    headline,
    whyItMatters,
    temperatureF: tempF,
    windMph,
    precipitationChance: precip,
    trackCondition,
  };
}

function indoorImpact(event: SportEvent): WeatherImpact {
  return {
    eventId: event.id,
    impactLevel: "low",
    badges: ["indoor-venue"],
    summary: "Indoor arena — weather unlikely to matter",
    headline: "Indoor venue",
    whyItMatters:
      "This game is played indoors, so rain, wind, and heat usually do not change how the game is played. " +
      "Focus on the odds and matchup instead of outdoor conditions.",
  };
}

function impactLevelFromSignals(input: {
  windMph: number;
  precip: number;
  tempF: number;
  rainy: boolean;
  sport: SportKey;
}): WeatherImpactLevel {
  if (input.windMph >= 20 || input.precip >= 60 || input.tempF >= 95 || (input.rainy && input.sport === "nascar")) {
    return "high";
  }
  if (input.windMph >= 12 || input.precip >= 35 || input.tempF >= 88) return "medium";
  return "low";
}

function buildSummary(input: {
  tempF: number;
  windMph: number;
  precip: number;
  rainy: boolean;
  trackCondition?: string;
  sport: SportKey;
}): string {
  const parts: string[] = [`${Math.round(input.tempF)}°F`];
  if (input.windMph >= 8) parts.push(`Wind ${Math.round(input.windMph)} mph`);
  if (input.precip >= 25 || input.rainy) {
    parts.push(input.precip >= 50 || input.rainy ? "Rain likely" : "Rain possible");
  }
  if (input.trackCondition) parts.push(`Track: ${input.trackCondition.toLowerCase()}`);
  if (input.sport === "nascar" && input.precip >= 30) parts.push("Delay possible");
  if (input.sport === "baseball" && input.windMph >= 12) parts.push("Fly balls may carry");
  return parts.join(" · ");
}

function trackConditionText(sport: SportKey, precip: number, rainy: boolean): string | undefined {
  if (!["horse-racing", "greyhound", "golf", "nascar"].includes(sport)) return undefined;
  if (precip >= 55 || rainy) return "Soft / muddy likely";
  if (precip >= 30) return "Damp";
  return "Dry";
}

function headlineForSport(sport: SportKey, level: WeatherImpactLevel): string {
  const label = level === "high" ? "High" : level === "medium" ? "Medium" : "Low";
  if (sport === "horse-racing" || sport === "greyhound") return `Track impact: ${label}`;
  if (sport === "golf") return `Course conditions: ${label}`;
  if (sport === "nascar") return `Race weather risk: ${label}`;
  return `Weather impact: ${label}`;
}

function whyItMattersForSport(
  sport: SportKey,
  ctx: {
    windMph: number;
    precip: number;
    tempF: number;
    rainy: boolean;
    trackCondition?: string;
    impactLevel: WeatherImpactLevel;
  },
): string {
  const parts: string[] = [];

  switch (sport) {
    case "football":
      if (ctx.windMph >= 12) {
        parts.push("Wind can make long passes and field goals less predictable.");
      }
      if (ctx.precip >= 35 || ctx.rainy) {
        parts.push("Rain may slow the field and increase fumbles or conservative play-calling.");
      }
      if (ctx.tempF >= 88) parts.push("Heat can increase fatigue, especially late in the game.");
      break;
    case "baseball":
      if (ctx.windMph >= 12) {
        parts.push("Wind can push fly balls farther or knock them down, changing home-run and extra-base hit odds.");
      }
      if (ctx.precip >= 35 || ctx.rainy) {
        parts.push("Rain delays are common and wet conditions can lower scoring.");
      }
      break;
    case "soccer":
      if (ctx.windMph >= 12) parts.push("Wind can change long balls, corners, and shot accuracy.");
      if (ctx.precip >= 35 || ctx.rainy) parts.push("A slick pitch often means fewer goals and more loose touches.");
      break;
    case "golf":
      if (ctx.windMph >= 12) parts.push("Wind is huge in golf — it changes club selection and makes scoring harder.");
      if (ctx.precip >= 35 || ctx.rainy) parts.push("Soft conditions can make approach shots stop faster on greens.");
      break;
    case "nascar":
      if (ctx.precip >= 30 || ctx.rainy) {
        parts.push("Rain can pause or shorten a race, changing strategy and which cars look strongest.");
      }
      if (ctx.windMph >= 18) parts.push("Strong wind can affect handling and drafting at speed.");
      break;
    case "horse-racing":
    case "greyhound":
      if (ctx.trackCondition) {
        parts.push(`A ${ctx.trackCondition.toLowerCase()} track can favor certain runners and change late speed.`);
      }
      if (ctx.precip >= 35 || ctx.rainy) parts.push("Wet weather often shifts which traps or post positions perform best.");
      break;
    default:
      break;
  }

  if (parts.length === 0) {
    return ctx.impactLevel === "low"
      ? "Outdoor conditions look fairly normal. Weather is unlikely to be the main story for this game."
      : "Outdoor conditions may nudge how the game plays, but they are only one piece of the puzzle.";
  }

  return parts.join(" ");
}

export function geoQueryForEvent(event: SportEvent): string | null {
  const home = homeTeamFromName(event.name);
  const venue = event.venue?.trim();

  if (venue && !LEAGUE_VENUES.has(venue)) {
    return `${venue}${home ? `, ${home}` : ""}`;
  }

  switch (event.sport) {
    case "football":
      return home ? `${home} NFL stadium` : null;
    case "baseball":
      return home ? `${home} MLB ballpark` : null;
    case "soccer":
      return home ? `${home} soccer stadium` : null;
    case "golf":
      return venue ? `${venue} golf course` : `${event.name} golf`;
    case "nascar":
      return venue ? `${venue} speedway` : `${event.name} NASCAR track`;
    case "horse-racing":
      return venue ? `${venue} racecourse UK` : null;
    case "greyhound":
      return venue ? `${venue} greyhound stadium UK` : null;
    default:
      return home ?? venue ?? null;
  }
}

export function homeTeamFromName(name: string): string | undefined {
  const at = name.lastIndexOf(" @ ");
  if (at < 0) return undefined;
  return name.slice(at + 3).trim() || undefined;
}

async function cachedGeocode(query: string): Promise<{ lat: number; lon: number } | null> {
  const key = query.toLowerCase();
  const hit = geoCache.get(key);
  if (hit && hit.expires > Date.now()) return hit;

  const coords = await geocodePlace(query);
  if (!coords) return null;
  geoCache.set(key, { ...coords, expires: Date.now() + GEO_TTL_MS });
  return coords;
}

async function cachedForecast(lat: number, lon: number, startTime: string): Promise<HourlyWeather | null> {
  const hourKey = startTime.slice(0, 13);
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}:${hourKey}`;
  const hit = forecastCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.reading;

  const reading = await fetchHourlyForecast(lat, lon, startTime);
  if (!reading) return null;
  forecastCache.set(key, { reading, expires: Date.now() + FORECAST_TTL_MS });
  return reading;
}