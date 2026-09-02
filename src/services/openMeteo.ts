import type { Location } from '@/types/config';
import type { WeatherData } from '@/types/weather';
import { WEATHER_CACHE_MINUTES } from '@/constants/thresholds';

export const WEATHER_STALE_MS = WEATHER_CACHE_MINUTES * 60 * 1000;

export interface ForecastPoint {
  lat: number;
  lon: number;
}

export function buildRoutePoints(home: Location, office: Location): ForecastPoint[] {
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    lat: home.lat + (office.lat - home.lat) * ratio,
    lon: home.lon + (office.lon - home.lon) * ratio,
  }));
}

export async function fetchRouteForecast(points: ForecastPoint[]): Promise<WeatherData[]> {
  const params = new URLSearchParams({
    latitude: points.map((point) => point.lat).join(','),
    longitude: points.map((point) => point.lon).join(','),
    hourly: 'precipitation_probability,precipitation,showers,weather_code,temperature_2m,wind_gusts_10m,visibility',
    current: 'temperature_2m,precipitation,rain,showers,weather_code,wind_gusts_10m',
    timezone: 'Asia/Kuala_Lumpur',
    // Covers the remaining days of this calendar week and all of next week.
    forecast_days: '14',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const json = await res.json() as Omit<WeatherData, 'fetchedAt'> | Array<Omit<WeatherData, 'fetchedAt'>>;
  const results = Array.isArray(json) ? json : [json];
  const incomplete = results.some((item) => {
    if (!item.hourly?.time?.length) return true;
    const length = item.hourly.time.length;
    return [item.hourly.precipitation_probability, item.hourly.precipitation, item.hourly.showers, item.hourly.weather_code, item.hourly.wind_gusts_10m].some((values) => !values || values.length !== length);
  });
  if (results.length !== points.length || incomplete) {
    throw new Error('Open-Meteo returned incomplete route data');
  }
  const fetchedAt = Date.now();
  return results.map((item) => ({ ...item, fetchedAt }));
}
