import type {
  MetLocation,
  MetLocationsResponse,
  MetDataResponse,
  ForecastPeriod,
  MetDailyForecast,
} from '@/types/metMalaysia';

const BASE_URL = '/api/met';

export function malaysiaDateStr(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

const PERIOD_MAP: Record<string, ForecastPeriod['period']> = {
  FGM: 'morning',
  FGA: 'afternoon',
  FGN: 'night',
};

const PERIOD_LABEL: Record<ForecastPeriod['period'], string> = {
  morning: 'Pagi',
  afternoon: 'Petang',
  night: 'Malam',
};

export async function fetchMetTownLocations(): Promise<MetLocation[]> {
  async function fetchPage(offset = 0): Promise<MetLocationsResponse> {
    const params = new URLSearchParams({ locationcategoryid: 'TOWN', offset: String(offset), limit: '100' });
    const res = await fetch(`${BASE_URL}/locations?${params}`);
    if (!res.ok) throw new Error(`MET locations error: ${res.status}`);
    return res.json() as Promise<MetLocationsResponse>;
  }

  const first = await fetchPage();
  const pageSize = first.metadata?.resultset?.limit || first.results?.length || 50;
  const total = first.metadata?.resultset?.count || first.results?.length || 0;
  const offsets: number[] = [];
  for (let offset = pageSize; offset < total; offset += pageSize) offsets.push(offset);
  const remaining = await Promise.all(offsets.map(fetchPage));
  const unique = new Map<string, MetLocation>();
  for (const location of [first, ...remaining].flatMap((page) => page.results ?? [])) {
    const id = location.id ?? location.locationid;
    if (id) unique.set(id, location);
  }
  return [...unique.values()];
}

export async function fetchTodayForecast(locationId: string): Promise<MetDailyForecast | null> {
  const today = malaysiaDateStr();
  const params = new URLSearchParams({
    datasetid: 'FORECAST',
    datacategoryid: 'GENERAL',
    locationid: locationId,
    start_date: today,
    end_date: today,
    lang: 'ms',
  });

  const res = await fetch(`${BASE_URL}/data?${params}`);
  if (!res.ok) throw new Error(`MET forecast error: ${res.status}`);
  const json = (await res.json()) as MetDataResponse;

  const periods: ForecastPeriod[] = (json.results ?? [])
    .filter((r) => PERIOD_MAP[r.datatype])
    .map((r) => {
      const period = PERIOD_MAP[r.datatype];
      return {
        period,
        label: PERIOD_LABEL[period],
        condition: typeof r.value === 'string' ? r.value : String(r.value ?? ''),
      };
    });

  if (periods.length === 0) return null;

  const locationName = json.results?.[0]?.locationname ?? '';
  return { locationId, locationName, date: today, periods };
}
