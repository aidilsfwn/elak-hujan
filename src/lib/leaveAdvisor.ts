import type { WeatherData } from '@/types/weather';
import type { TimeWindow } from '@/types/config';
import { getRouteHourly, timeToMinutes, toLocalDateStr } from '@/lib/rainScoring';
import { assessWeather, type WeatherAssessment } from '@/lib/weatherAssessment';

export interface HourlySlot {
  time: string;
  hour: number;
  probability: number;
  precipitationMm: number;
  showersMm: number;
  gustKmh: number | null;
  weatherCode: number | null;
  riskScore: number;
  assessment: WeatherAssessment;
  isNow?: boolean;
}

export interface LeaveRecommendation {
  recommendedTime: string;
  probability: number;
  hasCleanWindow: boolean;
  slots: HourlySlot[];
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
    const base = { time, hour: departureHour, probability: item.probability, precipitationMm: item.precipitationMm, showersMm: item.showersMm, gustKmh: item.gustKmh, weatherCode: item.weatherCode, isNow };
    const assessment = assessWeather({ probability: base.probability, precipitationMm: base.precipitationMm, showersMm: base.showersMm, gustKmh: base.gustKmh, weatherCode: base.weatherCode, threshold: rainThreshold });
    return [{ ...base, riskScore: assessment.riskScore, assessment }];
  });

  if (slots.length === 0) return null;
  const rideable = slots.filter((slot) => !slot.assessment.hardStop);
  const clean = rideable.find((slot) => slot.probability < rainThreshold);
  const candidates = rideable.length > 0 ? rideable : slots;
  const best = clean ?? candidates.reduce((winner, slot) => slot.riskScore < winner.riskScore ? slot : winner);
  return { recommendedTime: best.time, probability: best.probability, hasCleanWindow: !best.assessment.hardStop && best.probability < rainThreshold, slots };
}

export function getRollingSlots(routeWeather: WeatherData[], from: Date, rainThreshold: number, count = 4): HourlySlot[] {
  const fromHour = from.getHours();
  return getRouteHourly(routeWeather, toLocalDateStr(from)).flatMap((item) => {
    if (item.hour === 0) return [];
    const departureHour = item.hour - 1;
    if (departureHour < fromHour || departureHour >= fromHour + count || item.probability === null) return [];
    const isNow = departureHour === fromHour;
    const time = isNow
      ? `${String(fromHour).padStart(2, '0')}:${String(from.getMinutes()).padStart(2, '0')}`
      : `${String(departureHour).padStart(2, '0')}:00`;
    const base = { time, hour: departureHour, probability: item.probability, precipitationMm: item.precipitationMm, showersMm: item.showersMm, gustKmh: item.gustKmh, weatherCode: item.weatherCode, isNow };
    const assessment = assessWeather({ probability: base.probability, precipitationMm: base.precipitationMm, showersMm: base.showersMm, gustKmh: base.gustKmh, weatherCode: base.weatherCode, threshold: rainThreshold });
    return [{ ...base, riskScore: assessment.riskScore, assessment }];
  });
}
