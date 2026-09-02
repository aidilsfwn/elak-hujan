import { useEffect, useState } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LocationField } from '@/components/LocationField';
import { copy } from '@/constants/copy';
import { RAIN_TOLERANCE_OPTIONS } from '@/constants/thresholds';
import { useConfig } from '@/hooks/useConfig';
import { validateConfig } from '@/lib/configValidation';
import { clearConfig } from '@/lib/localStorage';
import type { UserConfig } from '@/types/config';

const weekdays = [{ key: 'monday', label: 'Isn' }, { key: 'tuesday', label: 'Sel' }, { key: 'wednesday', label: 'Rab' }, { key: 'thursday', label: 'Kha' }, { key: 'friday', label: 'Jum' }];

export function Settings() {
  const { config, setConfig } = useConfig();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<UserConfig>(() => config!);
  const [saved, setSaved] = useState(false);
  const errors = validateConfig(draft);
  const dirty = config ? JSON.stringify(draft) !== JSON.stringify(config) : false;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  if (!config) return null;
  const update = (value: Partial<UserConfig>) => setDraft((current) => ({ ...current, ...value }));
  const save = () => { if (errors.length) return; setConfig({ ...draft, configVersion: 4 }); setSaved(true); window.setTimeout(() => setSaved(false), 2000); };
  const reset = () => { if (window.confirm(copy.settings.resetConfirm)) { clearConfig(); navigate('/onboarding', { replace: true }); window.location.reload(); } };
  const tolerance = RAIN_TOLERANCE_OPTIONS.find((option) => option.value === draft.rainThreshold) ?? RAIN_TOLERANCE_OPTIONS[1];

  return <div className="settings-page">
    <header className="settings-heading"><span>Tetapan peribadi</span><h1>Bina rutin yang sesuai.</h1><p>Lokasi, masa dan toleransi risiko anda menentukan setiap cadangan.</p></header>
    <div className="settings-layout">
      <div className="settings-form">
        <section className="settings-section"><header><span>01</span><div><h2>Lokasi perjalanan</h2><p>Rumah dan pejabat membentuk lima titik semakan di sepanjang laluan.</p></div></header><div className="settings-location-grid"><LocationField label="Rumah" placeholder="Cari lokasi rumah…" value={draft.homeLocation} onChange={(homeLocation) => update({ homeLocation })} /><LocationField label="Pejabat" placeholder="Cari lokasi pejabat…" value={draft.officeLocation} onChange={(officeLocation) => update({ officeLocation })} /></div></section>

        <section className="settings-section"><header><span>02</span><div><h2>Tetingkap perjalanan</h2><p>Cadangan masa bertolak tidak akan keluar daripada julat ini.</p></div></header><div className="time-setting-grid">{(['morningWindow', 'eveningWindow'] as const).map((key) => <fieldset key={key}><legend>{key === 'morningWindow' ? 'Pagi' : 'Petang'}</legend><label>Mula<input aria-label={`${key} mula`} type="time" value={draft[key].start} onChange={(event) => update({ [key]: { ...draft[key], start: event.target.value } })} /></label><label>Tamat<input aria-label={`${key} tamat`} type="time" value={draft[key].end} onChange={(event) => update({ [key]: { ...draft[key], end: event.target.value } })} /></label></fieldset>)}</div></section>

        <section className="settings-section"><header><span>03</span><div><h2>Rutin pejabat</h2><p>Cuaca menentukan pilihan terbaik selepas hari yang anda tidak boleh hadir dikecualikan.</p></div></header><div className="routine-setting"><div><span>Hari seminggu</span><div>{[1,2,3,4,5].map((count) => <button type="button" key={count} onClick={() => update({ officeDaysPerWeek: count })} className={draft.officeDaysPerWeek === count ? 'is-selected' : ''}>{count}</button>)}</div></div><div><span>Hari saya tidak boleh ke pejabat</span><div>{weekdays.map((day) => { const selected = draft.unavailableDays.includes(day.key); return <button type="button" key={day.key} onClick={() => update({ unavailableDays: selected ? draft.unavailableDays.filter((item) => item !== day.key) : [...draft.unavailableDays, day.key] })} className={selected ? 'is-selected' : ''}>{day.label}</button>; })}</div></div></div></section>

        {errors.length > 0 && <div className="settings-errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
        <button className="settings-save" disabled={errors.length > 0 || !dirty} onClick={save}>{saved && <Check />}{saved ? 'Tetapan disimpan' : dirty ? 'Simpan perubahan' : 'Tiada perubahan'}</button>
      </div>

      <aside className="settings-aside">
        <section className="threshold-panel"><span>Toleransi hujan</span><strong>{tolerance.label}</strong><em>{tolerance.value}% peluang hujan</em><div className="tolerance-options" role="group" aria-label="Pilih tahap toleransi hujan">{RAIN_TOLERANCE_OPTIONS.map((option) => <button type="button" key={option.value} aria-pressed={draft.rainThreshold === option.value} className={draft.rainThreshold === option.value ? 'is-selected' : ''} onClick={() => update({ rainThreshold: option.value })}><b>{option.label}</b><small>{option.value}%</small></button>)}</div><p>{tolerance.description} Hujan lebat, ribut petir, angin kencang dan amaran rasmi tetap memotong barisan—toleransi bukan lesen jadi hero.</p></section>
        <details className="about-panel"><summary>Tentang ramalan</summary><div><h3>Sumber data</h3>{copy.about.sources.map((source) => <p key={source.name}><strong>{source.name}</strong><br />{source.desc}</p>)}<h3>Ketepatan dan had</h3>{copy.about.accuracyNotes.map((note) => <p key={note}>{note}</p>)}<p>{copy.about.disclaimer}</p><footer><a href={copy.about.github} target="_blank" rel="noreferrer">GitHub<ExternalLink /></a><a href={copy.about.linkedin} target="_blank" rel="noreferrer">LinkedIn<ExternalLink /></a></footer></div></details>
        <section className="reset-panel"><span>Mulakan semula</span><p>Padam lokasi dan rutin daripada peranti ini.</p><button onClick={reset}>Padam semua data</button></section>
      </aside>
    </div>
  </div>;
}
