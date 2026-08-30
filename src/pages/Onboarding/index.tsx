import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/useConfig';
import type { UserConfig } from '@/types/config';
import { StepCommute } from './StepCommute';
import { StepDays } from './StepDays';
import { StepLocation } from './StepLocation';

const initial: Partial<UserConfig> = { morningWindow: { start: '08:00', end: '09:00' }, eveningWindow: { start: '17:00', end: '18:00' }, officeDaysPerWeek: 3, preferredDays: ['monday','tuesday','wednesday','thursday','friday'], rainThreshold: 40 };
const steps = [
  { number: '01', label: 'Lokasi', title: 'Di mana perjalanan anda bermula?', body: 'Rumah menentukan ramalan pagi. Pejabat menentukan ramalan petang.' },
  { number: '02', label: 'Masa', title: 'Bila anda biasa bergerak?', body: 'Kami menilai hanya tetingkap masa yang penting kepada perjalanan anda.' },
  { number: '03', label: 'Rutin', title: 'Berapa hari anda ke pejabat?', body: 'Hari pilihan diberi keutamaan apabila minggu anda disusun.' },
];
function valid(step: number, draft: Partial<UserConfig>) { if (step === 0) return Boolean(draft.homeLocation?.name && draft.homeLocation.state && draft.officeLocation?.name && draft.officeLocation.state); if (step === 1) return Boolean(draft.morningWindow?.start && draft.morningWindow.end && draft.eveningWindow?.start && draft.eveningWindow.end); return Boolean(draft.officeDaysPerWeek && draft.preferredDays?.length); }

export function Onboarding() {
  const [step, setStep] = useState(0); const [draft, setDraft] = useState<Partial<UserConfig>>(initial); const { setConfig } = useConfig(); const navigate = useNavigate();
  const update = (value: Partial<UserConfig>) => setDraft((current) => ({ ...current, ...value }));
  const next = () => { if (step < 2) return setStep(step + 1); setConfig({ homeLocation: draft.homeLocation!, officeLocation: draft.officeLocation!, morningWindow: draft.morningWindow!, eveningWindow: draft.eveningWindow!, officeDaysPerWeek: draft.officeDaysPerWeek!, preferredDays: draft.preferredDays!, rainThreshold: draft.rainThreshold ?? 40, onboardingComplete: true, configVersion: 1 }); navigate('/leave', { replace: true }); };
  return <main className="setup-page"><aside className="setup-story"><div className="setup-brand"><img src="/favicon-96x96.png" alt="" aria-hidden="true" /><strong>ElakHujan</strong></div><div><span>{steps[step].label}</span><h1>{steps[step].title}</h1><p>{steps[step].body}</p></div><ol>{steps.map((item, index) => <li className={index === step ? 'is-current' : index < step ? 'is-done' : ''} key={item.number}><span>{item.number}</span>{item.label}</li>)}</ol></aside><section className="setup-form"><header><span>Langkah {step + 1} daripada 3</span><strong>{steps[step].label}</strong></header><AnimatePresence mode="wait"><motion.div className="setup-step" key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: .2 }}>{step === 0 && <StepLocation draft={draft} onUpdate={update} />}{step === 1 && <StepCommute draft={draft} onUpdate={update} />}{step === 2 && <StepDays draft={draft} onUpdate={update} />}</motion.div></AnimatePresence><footer>{step > 0 && <button onClick={() => setStep(step - 1)} aria-label="Kembali"><ArrowLeft /></button>}<button className="setup-next" disabled={!valid(step, draft)} onClick={next}>{step === 2 ? 'Lihat keputusan saya' : 'Seterusnya'}<ArrowRight /></button></footer></section></main>;
}
