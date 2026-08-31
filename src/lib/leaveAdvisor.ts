import type { WeatherData } from '@/types/weather';
import type { TimeWindow } from '@/types/config';
import { getRouteHourly, timeToMinutes, toLocalDateStr } from '@/lib/rainScoring';

export interface HourlySlot {
  time: string;
  hour: number;
  probability: number;
  precipitationMm: number;
  gustKmh: number | null;
  weatherCode: number | null;
  riskScore: number;
}

export interface LeaveRecommendation {
  recommendedTime: string;
  probability: number;
  hasCleanWindow: boolean;
  slots: HourlySlot[];
}

function slotRisk(slot: Omit<HourlySlot, 'riskScore'>): number {
  let score = slot.probability;
  if (slot.precipitationMm >= 2) score = Math.max(score, 85);
  else if (slot.precipitationMm >= 0.5) score = Math.max(score, 65);
  if ((slot.gustKmh ?? 0) >= 40) score = Math.max(score, 70);
  if ((slot.weatherCode ?? 0) >= 95) score = Math.max(score, 90);
  return score;
}

/** Finds the safest still-actionable slot in the configured evening scan window. */
export function getRecommendedLeaveTime(
  routeWeather: WeatherData[],
  date: Date,
  eveningWindow: TimeWindow,
  rainThreshold: number,
  notBefore?: Date,
): LeaveRecommendation | null {
  const scanStart = Math.max(0, timeToMinutes(eveningWindow.start) - 60);
  const scanEnd = Math.min(24 * 60, timeToMinutes(eveningWindow.end) + 120);
  const minimum = notBefore && toLocalDateStr(notBefore) === toLocalDateStr(date)
    ? notBefore.getHours() * 60 + notBefore.getMinutes()
    : scanStart;

  const slots = getRouteHourly(routeWeather, toLocalDateStr(date)).flatMap((item) => {
    if (item.hour === 0) return [];
    const departureHour = item.hour - 1;
    const slotMinutes = departureHour * 60;
    if (slotMinutes < scanStart || slotMinutes > scanEnd || slotMinutes < minimum || item.probability === null) return [];
    const base = { time: `${String(departureHour).padStart(2, '0')}:00`, hour: departureHour, probability: item.probability, precipitationMm: item.precipitationMm, gustKmh: item.gustKmh, weatherCode: item.weatherCode };
    return [{ ...base, riskScore: slotRisk(base) }];
  });

  if (slots.length === 0) return null;
  const best = slots.reduce((winner, slot) => slot.riskScore < winner.riskScore ? slot : winner);
  return { recommendedTime: best.time, probability: best.probability, hasCleanWindow: best.riskScore < rainThreshold, slots };
}

export function getRollingSlots(routeWeather: WeatherData[], date: Date, fromHour: number, count = 4): HourlySlot[] {
  return getRouteHourly(routeWeather, toLocalDateStr(date)).flatMap((item) => {
    if (item.hour === 0) return [];
    const departureHour = item.hour - 1;
    if (departureHour < fromHour || departureHour >= fromHour + count || item.probability === null) return [];
    const base = { time: `${String(departureHour).padStart(2, '0')}:00`, hour: departureHour, probability: item.probability, precipitationMm: item.precipitationMm, gustKmh: item.gustKmh, weatherCode: item.weatherCode };
    return [{ ...base, riskScore: slotRisk(base) }];
  });
}
