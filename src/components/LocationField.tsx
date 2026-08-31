import { useEffect, useRef, useState } from 'react';
import { Check, MapPin, Search } from 'lucide-react';
import { MALAYSIAN_STATES } from '@/constants/malaysia';
import { guessState, normaliseName } from '@/lib/location-utils';
import { searchLocations, type NominatimResult } from '@/services/nominatim';
import type { Location } from '@/types/config';

export function LocationField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value?: Location; onChange: (location: Location) => void }) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [matches, setMatches] = useState<NominatimResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => { const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setExpanded(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  useEffect(() => () => request.current?.abort(), []);

  async function search() {
    if (query.trim().length < 3) { setError('Masukkan sekurang-kurangnya 3 aksara.'); return; }
    request.current?.abort();
    request.current = new AbortController();
    setBusy(true); setError('');
    try {
      const results = await searchLocations(query.trim(), request.current.signal);
      setMatches(results); setExpanded(true);
      if (results.length === 0) setError('Tiada lokasi ditemui.');
    } catch (caught) {
      if ((caught as Error).name !== 'AbortError') { setMatches([]); setExpanded(true); setError('Carian gagal. Cuba lagi.'); }
    } finally { setBusy(false); }
  }

  function pick(match: NominatimResult) {
    const name = normaliseName(match.display_name);
    setQuery(name); setMatches([]); setExpanded(false); setError('');
    onChange({ name, lat: Number(match.lat), lon: Number(match.lon), state: guessState(match) });
  }

  const selected = Boolean(value?.name && value.name === query);
  return <div className="place-picker" ref={root}>
    <div className="place-label"><span>{label}</span>{selected && <small><MapPin />{value!.name}<Check /></small>}</div>
    <div className="place-search"><Search /><input value={query} placeholder={placeholder} autoComplete="off" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }} onChange={(event) => { setQuery(event.target.value); setMatches([]); setExpanded(false); setError('Pilih hasil carian untuk mengesahkan koordinat.'); if (selected) onChange({ name: '', lat: 0, lon: 0, state: '' }); }} /><button type="button" onClick={() => void search()} disabled={busy}>{busy ? 'Mencari…' : 'Cari'}</button>
      {expanded && <div className="place-results">{error && <p>{error}</p>}{matches.map((match) => <button type="button" key={match.place_id} onMouseDown={(event) => event.preventDefault()} onClick={() => pick(match)}><strong>{normaliseName(match.display_name)}</strong><span>{match.display_name}</span></button>)}</div>}
    </div>
    {error && !expanded && <p className="field-error">{error}</p>}
    {selected && <select aria-label={`Negeri ${label}`} value={value?.state ?? ''} onChange={(event) => onChange({ ...value!, state: event.target.value })}><option value="">Pilih negeri</option>{MALAYSIAN_STATES.map((state) => <option key={state}>{state}</option>)}</select>}
    <small className="osm-credit">Carian oleh OpenStreetMap Nominatim · tekan Cari, bukan carian automatik</small>
  </div>;
}
