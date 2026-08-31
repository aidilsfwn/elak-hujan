export interface HourlyForecast {
  time: string[];
  precipitation_probability: Array<number | null>;
  temperature_2m?: number[];
  precipitation?: number[];
  showers?: number[];
  weather_code?: number[];
  wind_gusts_10m?: number[];
  visibility?: number[];
}

export interface CurrentWeather {
  time: string;
  interval: number;
  temperature_2m?: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  weather_code?: number;
  wind_gusts_10m?: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone?: string;
  utc_offset_seconds?: number;
  hourly: HourlyForecast;
  current?: CurrentWeather;
  fetchedAt: number;
}
