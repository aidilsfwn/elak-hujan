import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRiskLevel } from '@/lib/risk';
import { getWeekKey, malaysiaNow, type ScoredDay } from '@/lib/rainScoring';

const names: Record<string, string> = { monday: 'Isnin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Khamis', friday: 'Jumaat' };

export function WeekRail({ days, threshold }: { days: ScoredDay[]; threshold: number }) {
  const firstWeek = days[0] ? getWeekKey(days[0].date) : null;
  const visibleDays = firstWeek ? days.filter((day) => getWeekKey(day.date) === firstWeek) : [];
  const weekLabel = firstWeek === getWeekKey(malaysiaNow()) ? 'minggu ini' : 'minggu depan';
  return <section className="week-rail">
    <header><div><span>Rancangan {weekLabel}</span><strong>{visibleDays.filter((day) => day.isRecommended).length} hari disyorkan</strong></div><Link to="/" aria-label="Buka pandangan minggu"><ArrowUpRight /></Link></header>
    <div className="week-rail-days">{visibleDays.map((day) => { const risk = getRiskLevel(day.combinedScore ?? 100, threshold); return <Link to={`/day/${day.dateStr}`} key={day.dateStr} className={`week-rail-day risk-${risk}`}><span className="risk-pin" /><div><strong>{names[day.dayName]}</strong><small>{day.isRecommended ? `Disyorkan · keyakinan ${day.confidence}` : day.date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</small></div><em>{day.combinedScore === null ? '—' : Math.round(day.combinedScore)}</em></Link>; })}</div>
  </section>;
}
