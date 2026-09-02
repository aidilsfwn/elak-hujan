import { describe, expect, it } from 'vitest';
import { buildSmartBriefing } from '@/lib/smartBriefing';
import type { ScoredDay } from '@/lib/rainScoring';

function day(dateStr: string, dayName: string, score: number, morning: number, evening: number, recommended = true): ScoredDay {
  return { date: new Date(`${dateStr}T00:00:00`), dateStr, dayName, morningScore: morning, eveningScore: evening, combinedScore: score, expectedRainMm: 0, peakGustKmh: 10, hasThunderstorm: false, confidence: 'tinggi', isUnavailable: false, isRecommended: recommended };
}

describe('smart weekly briefing', () => {
  it('combines remaining attendance with the best recommended commute', () => {
    const copy = buildSmartBriefing({
      days: [day('2026-09-02', 'wednesday', 40, 20, 50), day('2026-09-03', 'thursday', 20, 10, 30)],
      target: 3,
      completed: 2,
      isCurrentWeek: true,
    });
    expect(copy.headline).toBe('1 hari lagi untuk melengkapkan sasaran.');
    expect(copy.summary).toContain('Khamis ialah pilihan utama');
    expect(copy.summary).toContain('10% berbanding 30%');
  });

  it('frames the lowest-risk remaining day as optional after the target is complete', () => {
    const copy = buildSmartBriefing({
      days: [day('2026-09-02', 'wednesday', 20, 20, 20, false)],
      target: 3,
      completed: 3,
      isCurrentWeek: true,
    });
    expect(copy.headline).toBe('Sasaran minggu ini sudah selesai.');
    expect(copy.summary).toContain('Jika anda perlu hadir lagi, Rabu');
  });

  it('keeps next-week advice independent of current attendance', () => {
    const copy = buildSmartBriefing({
      days: [day('2026-09-07', 'monday', 20, 20, 20), day('2026-09-08', 'tuesday', 30, 30, 30)],
      target: 3,
      completed: 0,
      isCurrentWeek: false,
    });
    expect(copy.headline).toBe('2 hari disyorkan untuk minggu depan.');
    expect(copy.summary).toContain('Isnin ialah pilihan utama');
  });
});
