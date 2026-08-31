import type { WeatherData } from '@/types/weather';

export function weather(times: string[], probabilities: Array<number | null>, overrides: Partial<WeatherData['hourly']> = {}): WeatherData {
  return {
    latitude: 3.1,
    longitude: 101.6,
    fetchedAt: Date.now(),
    hourly: {
      time: times,
      precipitation_probability: probabilities,
      precipitation: probabilities.map(() => 0),
      showers: probabilities.map(() => 0),
      weather_code: probabilities.map(() => 1),
      wind_gusts_10m: probabilities.map(() => 10),
      ...overrides,
    },
  };
}
