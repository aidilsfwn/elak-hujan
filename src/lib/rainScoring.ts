import type { WeatherData } from '@/types/weather';
import type { UserConfig } from '@/types/config';

/** Returns the rain probability for the current local hour, or null if not found. */
export function getCurrentHourProb(weather: WeatherData): number | null {
  const now = new Date();
  const dateStr = toLocalDateStr(now);
  const hour = now.getHours();
  const timeKey = `${dateStr}T${String(hour).padStart(2, '0')}:00`;
  const idx = weather.hourly.time.indexOf(timeKey);
  return idx >= 0 ? weather.hourly.precipitation_probability[idx] : null;
}

export interface ScoredDay {
  date: Date;
  dateStr: string;   // "2026-02-24"
  dayName: string;   // "monday"
  morningScore: number;   // 0–100
  eveningScore: number;   // 0–100
  combinedScore: number;  // 0–100
  isPreferred: boolean;
  isRecommended: boolean;
}

const DAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

/** Format a local JS Date as "YYYY-MM-DD" using device local time. */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the next 5 weekdays starting from today (inclusive).
 * Always stays within the Open-Meteo 7-day window.
 */
export function getRollingWeekdays(today: Date): Date[] {
  const weekdays: Date[] = [];
  const base = new Date(today);
  base.setHours(0, 0, 0, 0);

  for (let i = 0; weekdays.length < 5 && i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) weekdays.push(d);
  }
  return weekdays;
}

/**
 * Averages precipitation probability across the given time window on a specific date.
 * Open-Meteo time strings are in format "2026-02-24T08:00" (local KL time).
 * Uses hour-level precision (start inclusive, end exclusive).
 */
export function extractWindowAverage(
  hourlyData: WeatherData,
  date: Date,
  startTime: string, // "08:00"
  endTime: string,   // "09:00"
): number {
  const dateStr = toLocalDateStr(date);
  const startH = parseInt(startTime.slice(0, 2), 10);
  const endH = parseInt(endTime.slice(0, 2), 10);

  const probs: number[] = [];
  hourlyData.hourly.time.forEach((t, i) => {
    if (t.slice(0, 10) !== dateStr) return;
    const hour = parseInt(t.slice(11, 13), 10);
    if (hour >= startH && hour < endH) {
      probs.push(hourlyData.hourly.precipitation_probability[i]);
    }
  });

  if (probs.length === 0) return 0;
  return probs.reduce((a, b) => a + b, 0) / probs.length;
}

/** Score all 5 rolling weekdays. isRecommended is set to false; call getRecommendedDays next. */
export function scoreDays(
  homeWeather: WeatherData,
  officeWeather: WeatherData,
  config: UserConfig,
): ScoredDay[] {
  const weekdays = getRollingWeekdays(new Date());

  return weekdays.map((date) => {
    const dayName = DAY_NAMES[date.getDay()];
    const morningScore = extractWindowAverage(
      homeWeather, date, config.morningWindow.start, config.morningWindow.end,
    );
    const eveningScore = extractWindowAverage(
      officeWeather, date, config.eveningWindow.start, config.eveningWindow.end,
    );
    return {
      date,
      dateStr: toLocalDateStr(date),
      dayName,
      morningScore,
      eveningScore,
      combinedScore: (morningScore + eveningScore) / 2,
      isPreferred: config.preferredDays.includes(dayName),
      isRecommended: false,
    };
  });
}

/**
 * Marks the top-N days as recommended.
 * Preferred days fill slots first (ranked by score); non-preferred fill any remaining gap.
 */
export function getRecommendedDays(
  scoredDays: ScoredDay[],
  count: number,
  preferredDays: string[],
): ScoredDay[] {
  const byScore = (a: ScoredDay, b: ScoredDay) => a.combinedScore - b.combinedScore;

  const preferred = scoredDays.filter((d) => preferredDays.includes(d.dayName)).sort(byScore);
  const nonPreferred = scoredDays.filter((d) => !preferredDays.includes(d.dayName)).sort(byScore);

  const recommended = new Set([
    ...preferred.slice(0, count).map((d) => d.dateStr),
    ...nonPreferred.slice(0, Math.max(0, count - preferred.length)).map((d) => d.dateStr),
  ]);

  return scoredDays.map((d) => ({ ...d, isRecommended: recommended.has(d.dateStr) }));
}
