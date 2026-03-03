import type { WeatherData } from '@/types/weather';
import { WEATHER_CACHE_MINUTES } from '@/constants/thresholds';

export const WEATHER_STALE_MS = WEATHER_CACHE_MINUTES * 60 * 1000;

export async function fetchHourlyForecast(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: 'precipitation_probability,temperature_2m',
    timezone: 'Asia/Kuala_Lumpur',
    forecast_days: '7',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  return res.json() as Promise<WeatherData>;
}
