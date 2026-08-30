import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRiskLevel } from '@/lib/risk';
import type { ScoredDay } from '@/lib/rainScoring';

const names: Record<string, string> = { monday: 'Isnin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Khamis', friday: 'Jumaat' };

export function WeekRail({ days, threshold }: { days: ScoredDay[]; threshold: number }) {
  return <section className="week-rail">
    <header><div><span>Rancangan minggu</span><strong>{days.filter((day) => day.isRecommended).length} hari disyorkan</strong></div><Link to="/" aria-label="Buka pandangan minggu"><ArrowUpRight /></Link></header>
    <div className="week-rail-days">{days.map((day) => { const risk = getRiskLevel(day.combinedScore, threshold); return <Link to={`/day/${day.dateStr}`} key={day.dateStr} className={`week-rail-day risk-${risk}`}><span className="risk-pin" /><div><strong>{names[day.dayName]}</strong><small>{day.isRecommended ? 'Disyorkan' : day.date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</small></div><em>{Math.round(day.combinedScore)}%</em></Link>; })}</div>
  </section>;
}
