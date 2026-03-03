export interface HourlyForecast {
  time: string[];
  precipitation_probability: number[];
  temperature_2m?: number[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  hourly: HourlyForecast;
}
