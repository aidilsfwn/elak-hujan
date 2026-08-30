import { useState } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LocationField } from '@/components/LocationField';
import { copy } from '@/constants/copy';
import { RAIN_THRESHOLD_MAX, RAIN_THRESHOLD_MIN } from '@/constants/thresholds';
import { useConfig } from '@/hooks/useConfig';
import { clearConfig } from '@/lib/localStorage';
import type { UserConfig } from '@/types/config';

const weekdays = [{ key: 'monday', label: 'Isn' }, { key: 'tuesday', label: 'Sel' }, { key: 'wednesday', label: 'Rab' }, { key: 'thursday', label: 'Kha' }, { key: 'friday', label: 'Jum' }];

export function Settings() {
  const { config, setConfig } = useConfig();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<UserConfig>(() => config!);
  const [saved, setSaved] = useState(false);
  if (!config) return null;
  const update = (value: Partial<UserConfig>) => setDraft((current) => ({ ...current, ...value }));
  const save = () => { setConfig(draft); setSaved(true); window.setTimeout(() => setSaved(false), 2000); };
  const reset = () => { if (window.confirm(copy.settings.resetConfirm)) { clearConfig(); navigate('/onboarding', { replace: true }); window.location.reload(); } };

  return <div className="settings-page">
    <header className="settings-heading"><span>Tetapan peribadi</span><h1>Bina rutin yang sesuai.</h1><p>Lokasi, masa dan toleransi risiko anda menentukan setiap cadangan.</p></header>
    <div className="settings-layout">
      <div className="settings-form">
        <section className="settings-section"><header><span>01</span><div><h2>Lokasi perjalanan</h2><p>Ramalan pagi menggunakan rumah; ramalan petang menggunakan pejabat.</p></div></header><div className="settings-location-grid"><LocationField label="Rumah" placeholder="Cari lokasi rumah…" value={draft.homeLocation} onChange={(homeLocation) => update({ homeLocation })} /><LocationField label="Pejabat" placeholder="Cari lokasi pejabat…" value={draft.officeLocation} onChange={(officeLocation) => update({ officeLocation })} /></div></section>

        <section className="settings-section"><header><span>02</span><div><h2>Tetingkap perjalanan</h2><p>Kami mengambil purata hujan hanya dalam masa ini.</p></div></header><div className="time-setting-grid">{(['morningWindow', 'eveningWindow'] as const).map((key) => <fieldset key={key}><legend>{key === 'morningWindow' ? 'Pagi' : 'Petang'}</legend><label>Mula<input aria-label={`${key} mula`} type="time" value={draft[key].start} onChange={(event) => update({ [key]: { ...draft[key], start: event.target.value } })} /></label><label>Tamat<input aria-label={`${key} tamat`} type="time" value={draft[key].end} onChange={(event) => update({ [key]: { ...draft[key], end: event.target.value } })} /></label></fieldset>)}</div></section>

        <section className="settings-section"><header><span>03</span><div><h2>Rutin pejabat</h2><p>Pilih bilangan hari dan hari yang anda lebih suka.</p></div></header><div className="routine-setting"><div><span>Hari seminggu</span><div>{[1,2,3,4,5].map((count) => <button key={count} onClick={() => update({ officeDaysPerWeek: count })} className={draft.officeDaysPerWeek === count ? 'is-selected' : ''}>{count}</button>)}</div></div><div><span>Hari pilihan</span><div>{weekdays.map((day) => { const selected = draft.preferredDays.includes(day.key); return <button key={day.key} onClick={() => update({ preferredDays: selected ? draft.preferredDays.filter((item) => item !== day.key) : [...draft.preferredDays, day.key] })} className={selected ? 'is-selected' : ''}>{day.label}</button>; })}</div></div></div></section>

        <button className="settings-save" onClick={save}>{saved && <Check />}{saved ? 'Tetapan disimpan' : 'Simpan perubahan'}</button>
      </div>

      <aside className="settings-aside">
        <section className="threshold-panel"><span>Had risiko hujan</span><strong>{draft.rainThreshold}%</strong><input aria-label="Had risiko hujan" type="range" min={RAIN_THRESHOLD_MIN} max={RAIN_THRESHOLD_MAX} step="5" value={draft.rainThreshold} onChange={(event) => update({ rainThreshold: Number(event.target.value) })} /><p>Perjalanan ditanda berisiko apabila ramalan melebihi nilai ini.</p></section>
        <details className="about-panel"><summary>Tentang ramalan</summary><div><h3>Sumber data</h3>{copy.about.sources.map((source) => <p key={source.name}><strong>{source.name}</strong><br />{source.desc}</p>)}<h3>Ketepatan dan had</h3>{copy.about.accuracyNotes.map((note) => <p key={note}>{note}</p>)}<p>{copy.about.disclaimer}</p><footer><a href={copy.about.github} target="_blank" rel="noreferrer">GitHub<ExternalLink /></a><a href={copy.about.linkedin} target="_blank" rel="noreferrer">LinkedIn<ExternalLink /></a></footer></div></details>
        <section className="reset-panel"><span>Mulakan semula</span><p>Padam lokasi dan rutin daripada peranti ini.</p><button onClick={reset}>Padam semua data</button></section>
      </aside>
    </div>
  </div>;
}
