import { describe, expect, it } from 'vitest';
import { getRecommendedLeaveTime, getRollingSlots } from '@/lib/leaveAdvisor';
import { weather } from './weatherFactory';

describe('leave advisor', () => {
  const route = [weather(['2026-09-01T17:00', '2026-09-01T18:00', '2026-09-01T19:00', '2026-09-01T20:00'], [70, 20, 45, 10])];

  it('includes the start and excludes the end of the configured hard boundary', () => {
    const result = getRecommendedLeaveTime(route, new Date(2026, 8, 1), { start: '17:00', end: '18:00' }, 40);
    expect(result?.slots.map((slot) => slot.time)).toEqual(['17:00']);
    expect(result?.recommendedTime).toBe('17:00');
  });

  it('chooses the earliest acceptable departure instead of a lower-risk later slot', () => {
    const result = getRecommendedLeaveTime(
      [weather(['2026-09-01T17:00', '2026-09-01T18:00', '2026-09-01T19:00'], [35, 20, 10])],
      new Date(2026, 8, 1),
      { start: '16:00', end: '18:00' },
      40,
    );
    expect(result?.recommendedTime).toBe('16:00');
    expect(result?.probability).toBe(35);
  });

  it('keeps the remainder of the current hour actionable without showing its elapsed start', () => {
    const now = new Date(2026, 8, 1, 17, 30);
    const result = getRecommendedLeaveTime(route, now, { start: '17:00', end: '19:00' }, 40, now);
    expect(result?.slots.map((slot) => slot.time)).toEqual(['17:30', '18:00']);
    expect(result?.slots[0].isNow).toBe(true);
    expect(result?.recommendedTime).toBe('17:30');
  });

  it('keeps now actionable until the final minute of the configured window', () => {
    const now = new Date(2026, 8, 1, 17, 59);
    const result = getRecommendedLeaveTime(route, now, { start: '17:00', end: '18:00' }, 40, now);
    expect(result?.slots.map((slot) => slot.time)).toEqual(['17:59']);
  });

  it('labels the current partial hour in the rolling forecast', () => {
    const now = new Date(2026, 8, 1, 17, 30);
    const slots = getRollingSlots(route, now, 40);
    expect(slots.map((slot) => slot.time)).toEqual(['17:30', '18:00', '19:00']);
    expect(slots[0].isNow).toBe(true);
  });

  it('prefers a non-hazardous fallback over a numerically lower hard-stop slot', () => {
    const result = getRecommendedLeaveTime(
      [weather(['2026-09-01T18:00', '2026-09-01T19:00'], [20, 80], { wind_gusts_10m: [40, 10] })],
      new Date(2026, 8, 1),
      { start: '17:00', end: '19:00' },
      40,
    );
    expect(result?.recommendedTime).toBe('18:00');
    expect(result?.slots[0].assessment.hardStop).toBe(true);
    expect(result?.slots[1].assessment.hardStop).toBe(false);
  });

  it('does not mark heavy rain, thunderstorms, or strong gusts clean for rain-ready riders', () => {
    const times = ['2026-09-01T18:00'];
    const now = new Date(2026, 8, 1, 17, 30);
    const heavy = getRecommendedLeaveTime([weather(times, [20], { precipitation: [2] })], now, { start: '17:00', end: '18:00' }, 55, now);
    const thunder = getRecommendedLeaveTime([weather(times, [20], { weather_code: [95] })], now, { start: '17:00', end: '18:00' }, 55, now);
    const gust = getRecommendedLeaveTime([weather(times, [20], { wind_gusts_10m: [40] })], now, { start: '17:00', end: '18:00' }, 55, now);
    expect([heavy, thunder, gust].every((result) => result?.hasCleanWindow === false)).toBe(true);
    expect([heavy, thunder, gust].every((result) => result?.slots[0].assessment.hardStop)).toBe(true);
  });

  it('returns null when no actionable forecast slot remains', () => {
    const now = new Date(2026, 8, 1, 18, 30);
    expect(getRecommendedLeaveTime(route, now, { start: '17:00', end: '18:00' }, 40, now)).toBeNull();
  });
});
