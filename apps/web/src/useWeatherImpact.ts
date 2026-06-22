import { useEffect, useState } from "react";
import type { SportEvent, SportKey, WeatherImpactSnapshot } from "@bettin2win/types";
import { API_BASE } from "./api";
import { WEATHER_SPORTS } from "./weatherExplain";

export function useWeatherImpact(sport: SportKey, events: SportEvent[], enabled: boolean) {
  const [impacts, setImpacts] = useState<Record<string, WeatherImpactSnapshot["impacts"][string]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !WEATHER_SPORTS.includes(sport) || events.length === 0) {
      setImpacts({});
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/weather-impact/${sport}`);
        if (!res.ok) return;
        const body = (await res.json()) as WeatherImpactSnapshot;
        if (!cancelled) setImpacts(body.impacts ?? {});
      } catch {
        if (!cancelled) setImpacts({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const timer = setInterval(load, 10 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sport, enabled, events.length, events.map((event) => event.id).join("|")]);

  return { impacts, loading };
}