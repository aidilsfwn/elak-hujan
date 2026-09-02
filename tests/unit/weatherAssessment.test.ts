import { describe, expect, it } from 'vitest';
import { normalizeRainThreshold, RAIN_TOLERANCE_OPTIONS } from '@/constants/thresholds';
import { getRiskLevel } from '@/lib/risk';
import { assessWeather } from '@/lib/weatherAssessment';

const assess = (overrides: Partial<Parameters<typeof assessWeather>[0]> = {}) => assessWeather({
  probability: 20,
  precipitationMm: 0,
  gustKmh: 10,
  weatherCode: 1,
  threshold: 40,
  ...overrides,
});

describe('weather assessment', () => {
  it('normalizes legacy slider values to rider-friendly presets', () => {
    expect(RAIN_TOLERANCE_OPTIONS.map((option) => option.value)).toEqual([30, 40, 55]);
    expect(normalizeRainThreshold(10)).toBe(30);
    expect(normalizeRainThreshold(47)).toBe(40);
    expect(normalizeRainThreshold(80)).toBe(55);
  });

  it('distinguishes dry, drizzle, light rain, steady rain, and downpours', () => {
    expect(assess().kind).toBe('dry');
    expect(assess({ precipitationMm: 0.2 }).kind).toBe('drizzle');
    expect(assess({ precipitationMm: 0.8 }).kind).toBe('light');
    expect(assess({ precipitationMm: 2 }).kind).toBe('downpour');
    expect(assess({ precipitationMm: 8 }).kind).toBe('downpour');
  });

  it('uses WMO codes when forecast amount alone understates the rain type', () => {
    expect(assess({ weatherCode: 51 }).kind).toBe('drizzle');
    expect(assess({ weatherCode: 80 }).kind).toBe('showers');
    expect(assess({ weatherCode: 63 })).toMatchObject({ kind: 'steady', hardStop: false });
    expect(assess({ weatherCode: 81 }).hardStop).toBe(false);
    expect(assess({ weatherCode: 82 }).kind).toBe('downpour');
  });

  it('never lets tolerance negotiate away hard hazards', () => {
    expect(assess({ threshold: 55, precipitationMm: 2 }).hardReason).toBe('heavy-rain');
    expect(assess({ threshold: 55, gustKmh: 40 }).hardReason).toBe('strong-gust');
    expect(assess({ threshold: 55, weatherCode: 95 }).hardReason).toBe('thunderstorm');
    expect(assess({ threshold: 55, warningActive: true }).hardReason).toBe('official-warning');
    expect(assess({ precipitationMm: 2 }).gear).toContain('Tunggu reda');
    expect(assess({ gustKmh: 40 }).gear).toContain('Tunggu angin reda');
    expect(assess({ warningActive: true }).gear).toContain('Tunggu amaran tamat');
    expect(getRiskLevel(70, 80)).toBe('high');
  });

  it('explains dry but above-tolerance forecasts without claiming it is already raining', () => {
    const result = assess({ probability: 45 });
    expect(result.kind).toBe('uncertain');
    expect(result.headline).toBe('Awan tengah buat keputusan.');
  });
});
