import { describe, expect, it } from 'vitest';
import { assessRouteWindow, getRecommendedDays, getRollingWeekdays, isValidTimeWindow, type ScoredDay } from '@/lib/rainScoring';
import { weather } from './weatherFactory';

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

  it('rejects reversed or empty windows', () => {
    expect(isValidTimeWindow('09:00', '08:00')).toBe(false);
    expect(isValidTimeWindow('08:00', '08:00')).toBe(false);
    expect(isValidTimeWindow('08:30', '09:15')).toBe(true);
  });

  it('can skip today after its actionable cutoff', () => {
    const monday = new Date(2026, 7, 31, 14);
    expect(getRollingWeekdays(monday, false)[0].getDay()).toBe(2);
  });

  it('does not recommend days whose data is unavailable', () => {
    const base = (dateStr: string, score: number | null, preferred = true): ScoredDay => ({ date: new Date(`${dateStr}T00:00:00`), dateStr, dayName: 'monday', morningScore: score, eveningScore: score, combinedScore: score, expectedRainMm: 0, peakGustKmh: 10, hasThunderstorm: false, confidence: 'tinggi', isPreferred: preferred, isRecommended: false });
    const result = getRecommendedDays([base('2026-09-01', null), base('2026-09-02', 30)], 1, ['monday']);
    expect(result[0].isRecommended).toBe(false);
    expect(result[1].isRecommended).toBe(true);
  });
});
