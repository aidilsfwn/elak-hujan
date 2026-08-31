import type { UserConfig } from '@/types/config';
import { isUserConfig } from '@/lib/configValidation';

const CONFIG_KEY = 'elakhujan_config';
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export function getConfig(): UserConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserConfig>;
    // v1 allowed fewer preferred days than the requested office-day count.
    // Preserve existing settings and fill that gap instead of resetting users.
    if (Array.isArray(parsed.preferredDays) && typeof parsed.officeDaysPerWeek === 'number') {
      const preferred = parsed.preferredDays.filter((day): day is string => typeof day === 'string');
      for (const day of WEEKDAYS) {
        if (preferred.length >= parsed.officeDaysPerWeek) break;
        if (!preferred.includes(day)) preferred.push(day);
      }
      parsed.preferredDays = preferred;
    }
    parsed.configVersion = 2;
    return isUserConfig(parsed) ? parsed : null;
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
