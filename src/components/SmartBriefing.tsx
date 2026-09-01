import { Sparkles } from 'lucide-react';
import { buildSmartBriefing } from '@/lib/smartBriefing';
import type { ScoredDay } from '@/lib/rainScoring';

export function SmartBriefing({ days, target, completed, isCurrentWeek }: { days: ScoredDay[]; target: number; completed: number; isCurrentWeek: boolean }) {
  const copy = buildSmartBriefing({ days, target, completed, isCurrentWeek });
  return <section className="smart-briefing" aria-labelledby="smart-briefing-title">
    <span className="smart-briefing-icon"><Sparkles /></span>
    <div>
      <header><span>Ringkasan pintar</span><small>Automatik</small></header>
      <h2 id="smart-briefing-title">{copy.headline}</h2>
      <p>{copy.summary}</p>
      <footer>Berdasarkan skor laluan, kehadiran dan keyakinan ramalan · tiada data dihantar</footer>
    </div>
  </section>;
}
