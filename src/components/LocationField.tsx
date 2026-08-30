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
  const userEdited = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => { const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setExpanded(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  useEffect(() => {
    if (!userEdited.current || query.trim().length < 3) { setMatches([]); setExpanded(false); return; }
    const timer = window.setTimeout(async () => { setBusy(true); try { setMatches(await searchLocations(query)); setExpanded(true); } catch { setMatches([]); setExpanded(true); } finally { setBusy(false); } }, 500);
    return () => window.clearTimeout(timer);
  }, [query]);

  function pick(match: NominatimResult) {
    const name = normaliseName(match.display_name); userEdited.current = false; setQuery(name); setMatches([]); setExpanded(false);
    onChange({ name, lat: Number(match.lat), lon: Number(match.lon), state: guessState(match) });
  }

  return <div className="place-picker" ref={root}>
    <div className="place-label"><span>{label}</span>{value?.name && <small><MapPin />{value.name}<Check /></small>}</div>
    <div className="place-search"><Search /><input value={query} placeholder={value?.name ? 'Cari lokasi lain…' : placeholder} autoComplete="off" onFocus={() => matches.length > 0 && setExpanded(true)} onChange={(event) => { userEdited.current = true; setQuery(event.target.value); }} />
      {expanded && <div className="place-results">{busy && <p>Mencari…</p>}{!busy && matches.length === 0 && <p>Tiada lokasi ditemui.</p>}{matches.map((match) => <button type="button" key={match.place_id} onMouseDown={(event) => event.preventDefault()} onClick={() => pick(match)}><strong>{normaliseName(match.display_name)}</strong><span>{match.display_name}</span></button>)}</div>}
    </div>
    <select aria-label={`Negeri ${label}`} value={value?.state ?? ''} onChange={(event) => onChange(value ? { ...value, state: event.target.value } : { name: '', lat: 0, lon: 0, state: event.target.value })}><option value="">Pilih negeri</option>{MALAYSIAN_STATES.map((state) => <option key={state}>{state}</option>)}</select>
  </div>;
}
