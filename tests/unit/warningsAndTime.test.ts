import { describe, expect, it } from 'vitest';
import { filterWarningsForRoute } from '@/services/dataGovMy';
import { malaysiaDateStr } from '@/services/metMalaysia';
import { resolveNearestLocationId } from '@/hooks/useNowcast';
import { validateConfig } from '@/lib/configValidation';
import type { UserConfig } from '@/types/config';

const config: UserConfig = {
  homeLocation: { name: 'Kuala Lumpur, Malaysia', lat: 3.14, lon: 101.69, state: 'W.P. Kuala Lumpur' },
  officeLocation: { name: 'Putrajaya, Malaysia', lat: 2.93, lon: 101.69, state: 'W.P. Putrajaya' },
  morningWindow: { start: '08:00', end: '09:00' }, eveningWindow: { start: '17:00', end: '18:00' },
  officeDaysPerWeek: 3, unavailableDays: ['thursday'], rainThreshold: 40, onboardingComplete: true, configVersion: 4,
};

describe('official data handling', () => {
  it('uses the Malaysian calendar date rather than UTC', () => {
    expect(malaysiaDateStr(new Date('2026-08-30T16:30:00Z'))).toBe('2026-08-31');
  });

  it('keeps route-area land warnings but excludes marine-only warnings', () => {
    const warnings = [
      { heading_en: 'Thunderstorm Warning', text_en: 'Thunderstorms in Kuala Lumpur and Putrajaya' },
      { heading_en: 'Strong Wind and Rough Seas', text_en: 'Rough seas in waters of Putrajaya' },
      { heading_en: 'Thunderstorm Warning', text_en: 'Thunderstorms in Johor' },
    ];
    expect(filterWarningsForRoute(warnings, config)).toHaveLength(1);
  });

  it('resolves the nearest MET town by coordinates, not list order', () => {
    const locations = [
      { id: 'bangsar', name: 'BANGSAR', latitude: 3.13, longitude: 101.67 },
      { id: 'putrajaya', name: 'PUTRAJAYA', latitude: 2.91667, longitude: 101.7 },
    ];
    expect(resolveNearestLocationId(config.officeLocation, locations)).toBe('putrajaya');
  });

  it('requires enough eligible weekdays to meet the office-day target', () => {
    expect(validateConfig({ ...config, unavailableDays: ['monday', 'tuesday', 'wednesday'] })).toContain('Tidak cukup hari tersedia untuk memenuhi bilangan hari pejabat.');
  });

  it('accepts only canonical rain tolerance presets', () => {
    expect(validateConfig({ ...config, rainThreshold: 55 })).not.toContain('Toleransi hujan tidak sah.');
    expect(validateConfig({ ...config, rainThreshold: 47 })).toContain('Toleransi hujan tidak sah.');
  });
});
