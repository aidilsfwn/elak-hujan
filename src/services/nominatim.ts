export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    state?: string;
    county?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

let lastRequestAt = 0;

export async function searchLocations(query: string, signal?: AbortSignal): Promise<NominatimResult[]> {
  const waitMs = Math.max(0, 1000 - (Date.now() - lastRequestAt));
  if (waitMs > 0) await new Promise<void>((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, waitMs);
    signal?.addEventListener('abort', () => { globalThis.clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
  lastRequestAt = Date.now();
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    countrycodes: 'my',
    addressdetails: '1',
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { 'Accept-Language': 'ms,en' },
      signal,
    },
  );

  if (!res.ok) throw new Error('Nominatim search failed');
  return res.json() as Promise<NominatimResult[]>;
}
