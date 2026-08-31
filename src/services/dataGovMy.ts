import type { WeatherWarning } from '@/types/warning';
import type { UserConfig } from '@/types/config';
import { WARNINGS_CACHE_MINUTES } from '@/constants/thresholds';

export const WARNINGS_STALE_MS = WARNINGS_CACHE_MINUTES * 60 * 1000;

/** Format a Date as "YYYY-MM-DDTHH:mm:ss" in local time, matching the API's timezone-naive format. */
function localISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export async function fetchActiveWarnings(): Promise<WeatherWarning[]> {
  const params = new URLSearchParams({
    limit: '50',
    sort: '-warning_issue__issued',
    valid_to__gte: localISOString(new Date()),
  });

  const res = await fetch(`https://api.data.gov.my/weather/warning?${params}`);
  if (!res.ok) throw new Error(`data.gov.my error: ${res.status}`);
  const warnings = (await res.json()) as WeatherWarning[];
  const now = Date.now();
  return warnings.filter((warning) => {
    const title = `${warning.heading_en} ${warning.heading_bm ?? ''} ${warning.warning_issue?.title_en ?? ''} ${warning.warning_issue?.title_bm ?? ''}`.toLowerCase();
    if (title.includes('no advisory') || title.includes('tiada nasihat')) return false;
    if (warning.valid_from && Date.parse(warning.valid_from) > now) return false;
    if (warning.valid_to && Date.parse(warning.valid_to) < now) return false;
    return true;
  });
}

const STATE_ALIASES: Record<string, string[]> = {
  'w.p. kuala lumpur': ['kuala lumpur', 'wilayah persekutuan kuala lumpur'],
  'w.p. putrajaya': ['putrajaya', 'wilayah persekutuan putrajaya'],
  'w.p. labuan': ['labuan', 'wilayah persekutuan labuan'],
  'pulau pinang': ['pulau pinang', 'penang'],
  melaka: ['melaka', 'malacca'],
};

function warningText(warning: WeatherWarning): string {
  return [warning.heading_en, warning.heading_bm, warning.text_en, warning.text_bm]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Keep only land-weather warnings that explicitly mention the user's route areas. */
export function filterWarningsForRoute(warnings: WeatherWarning[], config: UserConfig): WeatherWarning[] {
  const areaTokens = [config.homeLocation, config.officeLocation].flatMap((location) => {
    const state = location.state.toLowerCase();
    const shortName = location.name.split(',')[0]?.trim().toLowerCase();
    return [state, shortName, ...(STATE_ALIASES[state] ?? [])].filter((token) => token.length >= 4);
  });

  return warnings.filter((warning) => {
    const text = warningText(warning);
    const marineOnly = /laut bergelora|rough sea|perairan|waters of/.test(text) && !/ribut petir|thunderstorm|hujan lebat|heavy rain/.test(text);
    if (marineOnly) return false;
    return areaTokens.some((token) => text.includes(token));
  });
}
