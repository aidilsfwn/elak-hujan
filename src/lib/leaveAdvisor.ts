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
  isNow?: boolean;
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

/** Finds the earliest acceptable slot within the configured evening window. */
export function getRecommendedLeaveTime(
  routeWeather: WeatherData[],
  date: Date,
  eveningWindow: TimeWindow,
  rainThreshold: number,
  notBefore?: Date,
): LeaveRecommendation | null {
  const scanStart = timeToMinutes(eveningWindow.start);
  const scanEnd = timeToMinutes(eveningWindow.end);
  const minimum = notBefore && toLocalDateStr(notBefore) === toLocalDateStr(date)
    ? notBefore.getHours() * 60 + notBefore.getMinutes()
    : scanStart;

  const slots = getRouteHourly(routeWeather, toLocalDateStr(date)).flatMap((item) => {
    if (item.hour === 0) return [];
    const departureHour = item.hour - 1;
    const slotMinutes = departureHour * 60;
    const isNow = !!notBefore
      && toLocalDateStr(notBefore) === toLocalDateStr(date)
      && departureHour === notBefore.getHours()
      && minimum >= scanStart
      && minimum < scanEnd;
    if (slotMinutes < scanStart || slotMinutes >= scanEnd || (slotMinutes < minimum && !isNow) || item.probability === null) return [];
    const time = isNow
      ? `${String(notBefore!.getHours()).padStart(2, '0')}:${String(notBefore!.getMinutes()).padStart(2, '0')}`
      : `${String(departureHour).padStart(2, '0')}:00`;
    const base = { time, hour: departureHour, probability: item.probability, precipitationMm: item.precipitationMm, gustKmh: item.gustKmh, weatherCode: item.weatherCode, isNow };
    return [{ ...base, riskScore: slotRisk(base) }];
  });

  if (slots.length === 0) return null;
  const clean = slots.find((slot) => slot.riskScore < rainThreshold);
  const best = clean ?? slots.reduce((winner, slot) => slot.riskScore < winner.riskScore ? slot : winner);
  return { recommendedTime: best.time, probability: best.probability, hasCleanWindow: best.riskScore < rainThreshold, slots };
}

export function getRollingSlots(routeWeather: WeatherData[], from: Date, count = 4): HourlySlot[] {
  const fromHour = from.getHours();
  return getRouteHourly(routeWeather, toLocalDateStr(from)).flatMap((item) => {
    if (item.hour === 0) return [];
    const departureHour = item.hour - 1;
    if (departureHour < fromHour || departureHour >= fromHour + count || item.probability === null) return [];
    const isNow = departureHour === fromHour;
    const time = isNow
      ? `${String(fromHour).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`
      : `${String(departureHour).padStart(2, '0')}:00`;
    const base = { time, hour: departureHour, probability: item.probability, precipitationMm: item.precipitationMm, gustKmh: item.gustKmh, weatherCode: item.weatherCode, isNow };
    return [{ ...base, riskScore: slotRisk(base) }];
  });
}
