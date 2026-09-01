import type { WeatherData } from '@/types/weather';
import type { UserConfig } from '@/types/config';

export interface WindowAssessment {
  available: boolean;
  averageProbability: number | null;
  peakProbability: number | null;
  precipitationMm: number | null;
  peakGustKmh: number | null;
  hasThunderstorm: boolean;
  riskScore: number | null;
}

export interface RouteHour {
  time: string;
  hour: number;
  probability: number | null;
  precipitationMm: number;
  gustKmh: number | null;
  weatherCode: number | null;
}

export interface ScoredDay {
  date: Date;
  dateStr: string;
  dayName: string;
  morningScore: number | null;
  eveningScore: number | null;
  combinedScore: number | null;
  expectedRainMm: number | null;
  peakGustKmh: number | null;
  hasThunderstorm: boolean;
  confidence: 'tinggi' | 'sederhana' | 'rendah';
  isPreferred: boolean;
  isRecommended: boolean;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A Date whose local fields represent the current clock in Malaysia. */
export function malaysiaNow(date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return new Date(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isValidTimeWindow(start: string, end: string): boolean {
  return /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && timeToMinutes(end) > timeToMinutes(start);
}

/** Five actionable weekdays. Today is skipped once the morning commute has ended. */
export function getRollingWeekdays(today: Date, includeToday = true): Date[] {
  const weekdays: Date[] = [];
  const base = new Date(today);
  base.setHours(0, 0, 0, 0);
  const firstOffset = includeToday ? 0 : 1;

  for (let i = firstOffset; weekdays.length < 5 && i < 14; i++) {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    if (date.getDay() !== 0 && date.getDay() !== 6) weekdays.push(date);
  }
  return weekdays;
}

/** Remaining actionable weekdays in this calendar week, followed by next week. */
export function getPlanningWeekdays(today: Date, includeToday = true): Date[] {
  const base = new Date(today);
  base.setHours(0, 0, 0, 0);
  const day = base.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(base);
  nextMonday.setDate(base.getDate() + daysUntilMonday);
  const weekdays: Date[] = [];

  // Keep past days out of the plan, but do not let the next calendar week get
  // mixed into (or compete with) the remainder of this one.
  for (let offset = includeToday ? 0 : 1; offset < daysUntilMonday; offset++) {
    const date = new Date(base);
    date.setDate(base.getDate() + offset);
    if (date.getDay() !== 0 && date.getDay() !== 6) weekdays.push(date);
  }
  for (let offset = 0; offset < 5; offset++) {
    const date = new Date(nextMonday);
    date.setDate(nextMonday.getDate() + offset);
    weekdays.push(date);
  }
  return weekdays;
}

/** Stable Monday date used to group recommendations by calendar week. */
export function getWeekKey(date: Date): string {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return toLocalDateStr(monday);
}

function emptyAssessment(): WindowAssessment {
  return { available: false, averageProbability: null, peakProbability: null, precipitationMm: null, peakGustKmh: null, hasThunderstorm: false, riskScore: null };
}

/** Weight preceding-hour forecast buckets by their exact overlap with the configured window. */
export function assessRouteWindow(routeWeather: WeatherData[], date: Date, startTime: string, endTime: string): WindowAssessment {
  if (routeWeather.length === 0 || !isValidTimeWindow(startTime, endTime)) return emptyAssessment();
  const dateStr = toLocalDateStr(date);
  const windowStart = timeToMinutes(startTime);
  const windowEnd = timeToMinutes(endTime);
  const windowDuration = windowEnd - windowStart;

  const pointAssessments = routeWeather.map((weather) => {
    let probabilityWeight = 0;
    let weightedProbability = 0;
    let peakProbability = -1;
    let precipitationMm = 0;
    let peakGustKmh = -1;
    let hasThunderstorm = false;

    weather.hourly.time.forEach((time, index) => {
      if (time.slice(0, 10) !== dateStr) return;
      const bucketEnd = Number(time.slice(11, 13)) * 60 + Number(time.slice(14, 16));
      const overlap = Math.max(0, Math.min(windowEnd, bucketEnd) - Math.max(windowStart, bucketEnd - 60));
      if (overlap <= 0) return;
      const probability = weather.hourly.precipitation_probability[index];
      if (typeof probability !== 'number' || !Number.isFinite(probability)) return;
      probabilityWeight += overlap;
      weightedProbability += probability * overlap;
      peakProbability = Math.max(peakProbability, probability);
      precipitationMm += (weather.hourly.precipitation?.[index] ?? 0) * (overlap / 60);
      peakGustKmh = Math.max(peakGustKmh, weather.hourly.wind_gusts_10m?.[index] ?? -1);
      hasThunderstorm ||= (weather.hourly.weather_code?.[index] ?? 0) >= 95;
    });

    if (probabilityWeight < windowDuration * 0.75 || peakProbability < 0) return null;
    return { averageProbability: weightedProbability / probabilityWeight, peakProbability, precipitationMm, peakGustKmh: peakGustKmh >= 0 ? peakGustKmh : null, hasThunderstorm };
  });

  if (pointAssessments.some((assessment) => assessment === null)) return emptyAssessment();
  const valid = pointAssessments.filter((assessment): assessment is NonNullable<typeof assessment> => assessment !== null);
  const averageProbability = Math.max(...valid.map((assessment) => assessment.averageProbability));
  const peakProbability = Math.max(...valid.map((assessment) => assessment.peakProbability));
  const precipitationMm = Math.max(...valid.map((assessment) => assessment.precipitationMm));
  const gusts = valid.map((assessment) => assessment.peakGustKmh).filter((gust): gust is number => gust !== null);
  const peakGustKmh = gusts.length > 0 ? Math.max(...gusts) : null;
  const hasThunderstorm = valid.some((assessment) => assessment.hasThunderstorm);

  let riskScore = peakProbability * 0.65 + averageProbability * 0.35;
  if (precipitationMm >= 2) riskScore = Math.max(riskScore, 80);
  else if (precipitationMm >= 0.5) riskScore = Math.max(riskScore, 60);
  if (peakGustKmh !== null && peakGustKmh >= 40) riskScore = Math.max(riskScore, 70);
  if (hasThunderstorm) riskScore = Math.max(riskScore, 90);

  return { available: true, averageProbability, peakProbability, precipitationMm, peakGustKmh, hasThunderstorm, riskScore: Math.min(100, riskScore) };
}

export function extractWindowAverage(hourlyData: WeatherData, date: Date, startTime: string, endTime: string): number | null {
  return assessRouteWindow([hourlyData], date, startTime, endTime).averageProbability;
}

export function scoreDays(routeWeather: WeatherData[], config: UserConfig, now = malaysiaNow()): ScoredDay[] {
  const includeToday = now.getDay() !== 0 && now.getDay() !== 6
    ? now.getHours() * 60 + now.getMinutes() < timeToMinutes(config.morningWindow.end)
    : true;
  const weekdays = getPlanningWeekdays(now, includeToday);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return weekdays.map((date) => {
    const morning = assessRouteWindow(routeWeather, date, config.morningWindow.start, config.morningWindow.end);
    const evening = assessRouteWindow(routeWeather, date, config.eveningWindow.start, config.eveningWindow.end);
    const available = morning.riskScore !== null && evening.riskScore !== null;
    const combinedScore = available
      ? Math.max(morning.riskScore!, evening.riskScore!) * 0.75 + Math.min(morning.riskScore!, evening.riskScore!) * 0.25
      : null;
    const daysAway = Math.round((date.getTime() - todayMidnight) / 86_400_000);
    const confidence = daysAway <= 1 ? 'tinggi' : daysAway <= 3 ? 'sederhana' : 'rendah';
    const dayName = DAY_NAMES[date.getDay()];

    return {
      date,
      dateStr: toLocalDateStr(date),
      dayName,
      morningScore: morning.peakProbability,
      eveningScore: evening.peakProbability,
      combinedScore,
      expectedRainMm: morning.precipitationMm === null || evening.precipitationMm === null ? null : Math.max(morning.precipitationMm, evening.precipitationMm),
      peakGustKmh: morning.peakGustKmh === null && evening.peakGustKmh === null ? null : Math.max(morning.peakGustKmh ?? 0, evening.peakGustKmh ?? 0),
      hasThunderstorm: morning.hasThunderstorm || evening.hasThunderstorm,
      confidence,
      isPreferred: config.preferredDays.includes(dayName),
      isRecommended: false,
    };
  });
}

export function getRecommendedDays(scoredDays: ScoredDay[], count: number, preferredDays: string[], completedDates: string[] = []): ScoredDay[] {
  const byScore = (a: ScoredDay, b: ScoredDay) => a.combinedScore! - b.combinedScore!;
  const completed = new Set(completedDates);
  const weeks = new Map<string, ScoredDay[]>();
  scoredDays.filter((day) => day.combinedScore !== null && !completed.has(day.dateStr)).forEach((day) => {
    const key = getWeekKey(day.date);
    weeks.set(key, [...(weeks.get(key) ?? []), day]);
  });
  const recommended = new Set<string>();
  weeks.forEach((available, weekKey) => {
    const completedInWeek = [...completed].filter((dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return !Number.isNaN(date.getTime()) && getWeekKey(date) === weekKey;
    }).length;
    const remainingCount = Math.max(0, count - completedInWeek);
    const preferred = available.filter((day) => preferredDays.includes(day.dayName)).sort(byScore);
    const nonPreferred = available.filter((day) => !preferredDays.includes(day.dayName)).sort(byScore);
    preferred.slice(0, remainingCount).forEach((day) => recommended.add(day.dateStr));
    nonPreferred.slice(0, Math.max(0, remainingCount - preferred.length)).forEach((day) => recommended.add(day.dateStr));
  });
  return scoredDays.map((day) => ({ ...day, isRecommended: recommended.has(day.dateStr) }));
}

export function getRouteHourly(routeWeather: WeatherData[], dateStr: string): RouteHour[] {
  const times = routeWeather[0]?.hourly.time ?? [];
  return times.flatMap((time, index) => {
    if (time.slice(0, 10) !== dateStr) return [];
    const probabilities = routeWeather.map((weather) => weather.hourly.precipitation_probability[index]).filter((value): value is number => typeof value === 'number');
    const precipitation = routeWeather.map((weather) => weather.hourly.precipitation?.[index] ?? 0);
    const gusts = routeWeather.map((weather) => weather.hourly.wind_gusts_10m?.[index]).filter((value): value is number => typeof value === 'number');
    const codes = routeWeather.map((weather) => weather.hourly.weather_code?.[index]).filter((value): value is number => typeof value === 'number');
    return [{
      time,
      hour: Number(time.slice(11, 13)),
      probability: probabilities.length === routeWeather.length ? Math.max(...probabilities) : null,
      precipitationMm: Math.max(...precipitation),
      gustKmh: gusts.length ? Math.max(...gusts) : null,
      weatherCode: codes.length ? Math.max(...codes) : null,
    }];
  });
}
