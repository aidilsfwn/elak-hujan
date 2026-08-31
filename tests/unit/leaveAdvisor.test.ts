import { describe, expect, it } from 'vitest';
import { getRecommendedLeaveTime } from '@/lib/leaveAdvisor';
import { weather } from './weatherFactory';

describe('leave advisor', () => {
  const route = [weather(['2026-09-01T17:00', '2026-09-01T18:00', '2026-09-01T19:00', '2026-09-01T20:00'], [70, 20, 45, 10])];

  it('labels preceding-hour buckets as departure times and chooses the lowest risk', () => {
    const result = getRecommendedLeaveTime(route, new Date(2026, 8, 1), { start: '17:00', end: '18:00' }, 40);
    expect(result?.recommendedTime).toBe('19:00');
    expect(result?.probability).toBe(10);
  });

  it('never recommends a slot that has already passed', () => {
    const now = new Date(2026, 8, 1, 18, 30);
    const result = getRecommendedLeaveTime(route, now, { start: '17:00', end: '18:00' }, 40, now);
    expect(result?.slots.map((slot) => slot.time)).toEqual(['19:00']);
  });

  it('returns null when no actionable forecast slot remains', () => {
    const now = new Date(2026, 8, 1, 21, 0);
    expect(getRecommendedLeaveTime(route, now, { start: '17:00', end: '18:00' }, 40, now)).toBeNull();
  });
});
