import { describe, expect, it } from 'vitest';
import { assessRouteWindow, getPlanningWeekdays, getRecommendedDays, getRollingWeekdays, getRouteHourly, getWeekKey, isValidTimeWindow, type ScoredDay } from '@/lib/rainScoring';
import { weather } from './weatherFactory';

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function scoredDay(dateStr: string, score: number | null): ScoredDay {
  const date = new Date(`${dateStr}T00:00:00`);
  return { date, dateStr, dayName: dayNames[date.getDay()], morningScore: score, eveningScore: score, combinedScore: score, expectedRainMm: 0, peakGustKmh: 10, hasThunderstorm: false, hasHardHazard: false, confidence: 'tinggi', isUnavailable: false, isRecommended: false };
}

describe('route rain scoring', () => {
  it('weights minute-level overlap and retains the peak probability', () => {
    const point = weather(['2026-09-01T09:00', '2026-09-01T10:00'], [20, 80]);
    const result = assessRouteWindow([point], new Date(2026, 8, 1), '08:30', '09:30');
    expect(result.available).toBe(true);
    expect(result.averageProbability).toBe(50);
    expect(result.peakProbability).toBe(80);
  });

  it('never treats missing data as dry', () => {
    const result = assessRouteWindow([weather([], [])], new Date(2026, 8, 1), '08:00', '09:00');
    expect(result.available).toBe(false);
    expect(result.riskScore).toBeNull();
  });

  it('adds conservative floors for thunderstorms, heavy rain, and gusts', () => {
    const point = weather(['2026-09-01T09:00'], [20], { precipitation: [3], weather_code: [95], wind_gusts_10m: [45] });
    expect(assessRouteWindow([point], new Date(2026, 8, 1), '08:00', '09:00').riskScore).toBe(90);
  });

  it('uses peak hourly intensity and heavy WMO codes for hard hazards', () => {
    const accumulated = weather(['2026-09-01T09:00', '2026-09-01T10:00'], [20, 20], { precipitation: [1.1, 1.1] });
    const codedHeavy = weather(['2026-09-01T09:00'], [20], { precipitation: [0.1], weather_code: [65] });
    expect(assessRouteWindow([accumulated], new Date(2026, 8, 1), '08:00', '10:00')).toMatchObject({ precipitationMm: 2.2, peakPrecipitationMm: 1.1, hasHardHazard: false });
    expect(assessRouteWindow([codedHeavy], new Date(2026, 8, 1), '08:30', '09:00').hasHardHazard).toBe(true);
  });

  it('preserves categorical heavy-rain hazards across route points', () => {
    const heavy = weather(['2026-09-01T09:00'], [20], { precipitation: [0.1], weather_code: [65] });
    const shower = weather(['2026-09-01T09:00'], [20], { precipitation: [0.1], weather_code: [81] });
    expect(getRouteHourly([heavy, shower], '2026-09-01')[0].weatherCode).toBe(65);
  });

  it('rejects reversed or empty windows', () => {
    expect(isValidTimeWindow('09:00', '08:00')).toBe(false);
    expect(isValidTimeWindow('08:00', '08:00')).toBe(false);
    expect(isValidTimeWindow('08:30', '09:15')).toBe(true);
  });

  it('can skip today after its actionable cutoff', () => {
    const monday = new Date(2026, 7, 31, 14);
    expect(getRollingWeekdays(monday, false)[0].getDay()).toBe(2);
  });

  it('keeps the remainder of this week and next week as distinct calendar groups', () => {
    const wednesday = new Date(2026, 8, 2, 8);
    const result = getPlanningWeekdays(wednesday, true);
    expect(result.map((date) => date.getDay())).toEqual([3, 4, 5, 1, 2, 3, 4, 5]);
    expect(new Set(result.map(getWeekKey)).size).toBe(2);
  });

  it('does not recommend days whose weather data is unavailable', () => {
    const result = getRecommendedDays([scoredDay('2026-09-01', null), scoredDay('2026-09-02', 30)], 1, []);
    expect(result[0].isRecommended).toBe(false);
    expect(result[1].isRecommended).toBe(true);
  });

  it('never recommends a day with a hard weather hazard', () => {
    const hazardous = { ...scoredDay('2026-09-07', 5), hasHardHazard: true };
    const safe = scoredDay('2026-09-08', 30);
    const result = getRecommendedDays([hazardous, safe], 1, []);
    expect(result.find((day) => day.dateStr === '2026-09-07')?.isRecommended).toBe(false);
    expect(result.find((day) => day.dateStr === '2026-09-08')?.isRecommended).toBe(true);
  });

  it('excludes unavailable weekdays even when they have the lowest weather risk', () => {
    const result = getRecommendedDays([
      scoredDay('2026-09-07', 50), scoredDay('2026-09-08', 10), scoredDay('2026-09-09', 20), scoredDay('2026-09-10', 5), scoredDay('2026-09-11', 30),
    ], 3, ['thursday']);
    expect(result.filter((day) => day.isRecommended).map((day) => day.dayName)).toEqual(['tuesday', 'wednesday', 'friday']);
    expect(result.find((day) => day.dayName === 'thursday')).toMatchObject({ isUnavailable: true, isRecommended: false });
  });

  it('selects the configured number of lowest-risk eligible days independently per week', () => {
    const result = getRecommendedDays([
      scoredDay('2026-09-02', 30), scoredDay('2026-09-03', 20), scoredDay('2026-09-04', 10),
      scoredDay('2026-09-07', 50), scoredDay('2026-09-08', 40), scoredDay('2026-09-09', 30), scoredDay('2026-09-10', 20), scoredDay('2026-09-11', 10),
    ], 3, []);
    const counts = new Map<string, number>();
    result.filter((day) => day.isRecommended).forEach((day) => counts.set(getWeekKey(day.date), (counts.get(getWeekKey(day.date)) ?? 0) + 1));
    expect([...counts.values()]).toEqual([3, 3]);
  });

  it('reduces only the current week recommendation count for completed office days', () => {
    const result = getRecommendedDays([
      scoredDay('2026-09-02', 10), scoredDay('2026-09-03', 20), scoredDay('2026-09-04', 30),
      scoredDay('2026-09-07', 10), scoredDay('2026-09-08', 20), scoredDay('2026-09-09', 30), scoredDay('2026-09-10', 40), scoredDay('2026-09-11', 50),
    ], 3, [], ['2026-08-31', '2026-09-01']);
    const counts = new Map<string, number>();
    result.filter((day) => day.isRecommended).forEach((day) => counts.set(getWeekKey(day.date), (counts.get(getWeekKey(day.date)) ?? 0) + 1));
    expect([...counts.values()]).toEqual([1, 3]);
  });

  it('never recommends a completed day that is still in the actionable forecast', () => {
    const result = getRecommendedDays([
      scoredDay('2026-09-01', 5), scoredDay('2026-09-02', 20), scoredDay('2026-09-03', 30), scoredDay('2026-09-04', 40),
    ], 3, [], ['2026-08-31', '2026-09-01']);
    expect(result.find((day) => day.dateStr === '2026-09-01')?.isRecommended).toBe(false);
    expect(result.filter((day) => day.isRecommended)).toHaveLength(1);
  });
});
