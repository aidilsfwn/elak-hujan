export const RAIN_THRESHOLD_DEFAULT = 40;
export const RAIN_THRESHOLD_MIN = 10;
export const RAIN_THRESHOLD_MAX = 80;

export const RISK_LEVELS = {
  LOW:    { max: 40,  label: 'Rendah',    color: 'text-emerald-700 bg-emerald-100 border-emerald-300' },
  MEDIUM: { max: 70,  label: 'Sederhana', color: 'text-amber-700 bg-amber-100 border-amber-300' },
  HIGH:   { max: 100, label: 'Tinggi',    color: 'text-red-700 bg-red-100 border-red-300' },
} as const;

export const WEATHER_CACHE_MINUTES = 10;
export const WEATHER_REFRESH_MINUTES = 10;
export const WARNINGS_CACHE_MINUTES = 30;
export const NOWCAST_CACHE_MINUTES = 5;
export const MET_LOCATIONS_CACHE_HOURS = 24;
export const LEAVE_ADVISOR_LEAD_HOURS = 2;
