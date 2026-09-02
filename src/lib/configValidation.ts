import { RAIN_TOLERANCE_OPTIONS } from '@/constants/thresholds';
import { isValidTimeWindow } from '@/lib/rainScoring';
import type { Location, UserConfig } from '@/types/config';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

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
  if (!Array.isArray(config.unavailableDays) || config.unavailableDays.some((day) => !WEEKDAYS.includes(day)) || new Set(config.unavailableDays).size !== config.unavailableDays.length) errors.push('Hari yang tidak tersedia tidak sah.');
  else if (WEEKDAYS.length - config.unavailableDays.length < (config.officeDaysPerWeek ?? 1)) errors.push('Tidak cukup hari tersedia untuk memenuhi bilangan hari pejabat.');
  if (!RAIN_TOLERANCE_OPTIONS.some((option) => option.value === config.rainThreshold)) errors.push('Toleransi hujan tidak sah.');
  return errors;
}

export function isUserConfig(value: unknown): value is UserConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<UserConfig>;
  return config.onboardingComplete === true && config.configVersion === 4 && validateConfig(config).length === 0;
}
