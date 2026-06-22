export interface HourlyWeather {
  temperatureF: number;
  windMph: number;
  precipitationChance: number;
  weatherCode: number;
}

interface GeoResult {
  results?: Array<{ latitude: number; longitude: number }>;
}

interface ForecastResult {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    wind_speed_10m?: number[];
    weather_code?: number[];
  };
}

export async function geocodePlace(query: string): Promise<{ lat: number; lon: number } | null> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}` +
    "&count=1&language=en&format=json";

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const body = (await res.json()) as GeoResult;
    const hit = body.results?.[0];
    if (!hit) return null;
    return { lat: hit.latitude, lon: hit.longitude };
  } catch {
    return null;
  }
}

export async function fetchHourlyForecast(
  lat: number,
  lon: number,
  startTime: string,
): Promise<HourlyWeather | null> {
  const start = new Date(startTime);
  if (!Number.isFinite(start.getTime())) return null;

  const day = start.toISOString().slice(0, 10);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto" +
    `&start_date=${day}&end_date=${day}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const body = (await res.json()) as ForecastResult;
    const times = body.hourly?.time ?? [];
    if (times.length === 0) return null;

    const targetHour = start.toISOString().slice(0, 13);
    let index = times.findIndex((time) => time.startsWith(targetHour));
    if (index < 0) {
      index = times.reduce((best, time, idx) => {
        const delta = Math.abs(Date.parse(time) - start.getTime());
        const bestDelta = Math.abs(Date.parse(times[best] ?? time) - start.getTime());
        return delta < bestDelta ? idx : best;
      }, 0);
    }

    const temperatureF = body.hourly?.temperature_2m?.[index];
    const windMph = body.hourly?.wind_speed_10m?.[index];
    const precipitationChance = body.hourly?.precipitation_probability?.[index];
    const weatherCode = body.hourly?.weather_code?.[index];
    if (
      temperatureF === undefined ||
      windMph === undefined ||
      precipitationChance === undefined ||
      weatherCode === undefined
    ) {
      return null;
    }

    return { temperatureF, windMph, precipitationChance, weatherCode };
  } catch {
    return null;
  }
}