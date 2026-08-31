import { useState } from 'react';
import { AlertTriangle, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useWarnings } from '@/hooks/useWarnings';
import type { WeatherWarning } from '@/types/warning';

const KEY = 'elakhujan_dismissed_warnings';
function remembered(): string[] { try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]') as string[]; } catch { return []; } }
function identity(items: WeatherWarning[]) { return items.map((item) => `${item.heading_en}-${item.warning_issue?.issued ?? ''}`).join('|'); }

export function WarningAlert({ inset = false }: { inset?: boolean }) {
  const { warnings } = useWarnings();
  const [hidden, setHidden] = useState(remembered);
  const [open, setOpen] = useState(false);
  const id = identity(warnings);
  const visible = warnings.length > 0 && !hidden.includes(id);
  const dismiss = () => { const next = [...hidden, id]; sessionStorage.setItem(KEY, JSON.stringify(next)); setHidden(next); };

  return <AnimatePresence initial={false}>{visible && <motion.aside className={`warning-ribbon ${inset ? 'is-inset' : ''}`} initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .2 }} aria-label="Amaran cuaca rasmi">
    <AlertTriangle aria-hidden="true" />
    <div className="warning-copy"><span>Amaran MET untuk kawasan laluan</span><strong>{warnings[0].heading_bm ?? warnings[0].heading_en}</strong>{open && <p>{warnings[0].text_bm ?? warnings[0].text_en}</p>}{open && warnings.slice(1).map((item, index) => <p key={index}><strong>{item.heading_bm ?? item.heading_en}</strong><br />{item.text_bm ?? item.text_en}</p>)}{warnings.length > 1 && <button onClick={() => setOpen((value) => !value)}>{open ? 'Ringkaskan' : `${warnings.length} amaran berkaitan`}<ChevronDown className={open ? 'is-open' : ''} /></button>}</div>
    <button className="warning-close" onClick={dismiss} aria-label="Tutup amaran"><X /></button>
  </motion.aside>}</AnimatePresence>;
}
