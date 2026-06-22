import type { SportEvent, SportKey, WeatherImpact } from "@bettin2win/types";
import {
  impactLevelLabel,
  indoorWeatherImpact,
  WEATHER_BADGE_HINTS,
  WEATHER_BADGE_LABELS,
  WEATHER_SPORTS,
} from "./weatherExplain";

const INDOOR_SPORTS: SportKey[] = ["basketball", "hockey"];

interface WeatherImpactBadgeProps {
  event: SportEvent;
  impact?: WeatherImpact;
  loading?: boolean;
}

export function WeatherImpactBadge({ event, impact, loading }: WeatherImpactBadgeProps) {
  if (!WEATHER_SPORTS.includes(event.sport)) return null;

  const resolved =
    impact ?? (INDOOR_SPORTS.includes(event.sport) ? indoorWeatherImpact(event.id) : undefined);

  if (loading && !resolved) {
    return (
      <div className="weather-impact weather-impact--loading" aria-label="Loading weather impact">
        <span className="weather-impact-kicker">Game Weather</span>
        <span className="weather-impact-summary">Checking outdoor conditions…</span>
      </div>
    );
  }

  if (!resolved) return null;

  return (
    <details className="weather-impact">
      <summary className="weather-impact-summary-row">
        <span className="weather-impact-kicker">Game Weather</span>
        <span className={`weather-impact-level weather-impact-level--${resolved.impactLevel}`}>
          {resolved.headline}
        </span>
        <span className="weather-impact-text">{resolved.summary}</span>
        <span className="weather-impact-open">Why it matters</span>
      </summary>
      <div className="weather-impact-body">
        <div className="weather-impact-badges">
          {resolved.badges.map((badge) => (
            <span key={badge} className={`weather-badge weather-badge--${badge}`} title={WEATHER_BADGE_HINTS[badge]}>
              {WEATHER_BADGE_LABELS[badge]}
            </span>
          ))}
          {!resolved.badges.length && (
            <span className="weather-badge weather-badge--clear">Clear conditions</span>
          )}
        </div>
        <p className="weather-impact-event">{event.name}</p>
        <p className="weather-impact-why">
          <strong>Why it matters:</strong> {resolved.whyItMatters}
        </p>
        <p className="weather-impact-foot">
          Outdoor game conditions translated into plain English · Impact level:{" "}
          <strong>{impactLevelLabel(resolved.impactLevel)}</strong>
        </p>
      </div>
    </details>
  );
}