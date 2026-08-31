import { RAIN_THRESHOLD_MAX, RAIN_THRESHOLD_MIN } from '@/constants/thresholds';
import { isValidTimeWindow } from '@/lib/rainScoring';
import type { Location, UserConfig } from '@/types/config';

export function isValidLocation(location: Location | undefined): boolean {
  return Boolean(location?.name && location.state && Number.isFinite(location.lat) && Number.isFinite(location.lon) && location.lat >= -90 && location.lat <= 90 && location.lon >= -180 && location.lon <= 180 && !(location.lat === 0 && location.lon === 0));
}

export function validateConfig(config: Partial<UserConfig>): string[] {
  const errors: string[] = [];
  if (!isValidLocation(config.homeLocation)) errors.push('Pilih lokasi rumah daripada hasil carian.');
  if (!isValidLocation(config.officeLocation)) errors.push('Pilih lokasi pejabat daripada hasil carian.');
  if (!config.morningWindow || !isValidTimeWindow(config.morningWindow.start, config.morningWindow.end)) errors.push('Waktu pagi mesti tamat selepas waktu mula.');
  if (!config.eveningWindow || !isValidTimeWindow(config.eveningWindow.start, config.eveningWindow.end)) errors.push('Waktu petang mesti tamat selepas waktu mula.');
  if (!Number.isInteger(config.officeDaysPerWeek) || config.officeDaysPerWeek! < 1 || config.officeDaysPerWeek! > 5) errors.push('Bilangan hari pejabat mesti antara 1 hingga 5.');
  if (!Array.isArray(config.preferredDays) || config.preferredDays.some((day) => typeof day !== 'string') || config.preferredDays.length < (config.officeDaysPerWeek ?? 1)) errors.push('Pilih sekurang-kurangnya sebanyak bilangan hari pejabat.');
  if (typeof config.rainThreshold !== 'number' || config.rainThreshold < RAIN_THRESHOLD_MIN || config.rainThreshold > RAIN_THRESHOLD_MAX) errors.push('Had hujan tidak sah.');
  return errors;
}

export function isUserConfig(value: unknown): value is UserConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<UserConfig>;
  return config.onboardingComplete === true && validateConfig(config).length === 0;
}
