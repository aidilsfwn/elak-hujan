import { normalizeRainThreshold } from '@/constants/thresholds';
import type { UserConfig } from '@/types/config';
import { isUserConfig } from '@/lib/configValidation';

const CONFIG_KEY = 'elakhujan_config';
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export function getConfig(): UserConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserConfig> & { preferredDays?: unknown };
    if (typeof parsed.configVersion === 'number' && parsed.configVersion > 4) return null;
    // v1/v2 stored preferred days; their complement becomes unavailable.
    // This preserves the days users selected while adopting hard constraints.
    if (!Array.isArray(parsed.unavailableDays)) {
      const preferred = Array.isArray(parsed.preferredDays)
        ? parsed.preferredDays.filter((day): day is string => typeof day === 'string')
        : WEEKDAYS;
      parsed.unavailableDays = WEEKDAYS.filter((day) => !preferred.includes(day));
    }
    delete parsed.preferredDays;
    parsed.rainThreshold = normalizeRainThreshold(parsed.rainThreshold);
    parsed.configVersion = 4;
    if (!isUserConfig(parsed)) return null;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return null;
  }
}

export function setConfig(config: UserConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
}
