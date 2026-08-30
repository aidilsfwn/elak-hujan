import { ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { OfficialForecast } from '@/components/OfficialForecast';
import { WarningAlert } from '@/components/WarningAlert';
import { useConfig } from '@/hooks/useConfig';
import { useDayRecommendation } from '@/hooks/useDayRecommendation';
import { useLeaveAdvisorVisible } from '@/hooks/useLeaveAdvisorVisible';
import { useNowcast } from '@/hooks/useNowcast';
import { useWeather } from '@/hooks/useWeather';
import { getRecommendedLeaveTime } from '@/lib/leaveAdvisor';
import { getCurrentHourProb, toLocalDateStr, type ScoredDay } from '@/lib/rainScoring';
import { getRiskLevel, getVerdict, riskLabel } from '@/lib/risk';

const names: Record<string, string> = { monday: 'Isnin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Khamis', friday: 'Jumaat' };

function SmallDay({ day, threshold, index }: { day: ScoredDay; threshold: number; index: number }) {
  const risk = getRiskLevel(day.combinedScore, threshold);
  return <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}><Link to={`/day/${day.dateStr}`} className={`week-mini risk-${risk}`}><header><span>{day.date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</span>{day.isRecommended && <em>Disyorkan</em>}</header><h3>{names[day.dayName]}</h3><div><p><span>Pagi</span><strong>{Math.round(day.morningScore)}%</strong></p><p><span>Petang</span><strong>{Math.round(day.eveningScore)}%</strong></p></div><i className="risk-pin" /></Link></motion.div>;
}

export function Weekly() {
  const { config } = useConfig();
  const recommendation = useDayRecommendation();
  const weather = useWeather();
  const showLeave = useLeaveAdvisorVisible();
  const official = useNowcast(config?.officeLocation);
  if (!config) return null;

  const [lead, ...following] = recommendation.days;
  const current = weather.homeWeather ? getCurrentHourProb(weather.homeWeather) : null;
  const nowRisk = getRiskLevel(current ?? 0, config.rainThreshold);
  const leave = weather.officeWeather ? getRecommendedLeaveTime(weather.officeWeather, new Date(), config.eveningWindow, config.rainThreshold) : null;
  const leadRisk = getRiskLevel(lead?.combinedScore ?? 0, config.rainThreshold);
  const leadIsToday = lead?.dateStr === toLocalDateStr(new Date());

  return <div className="weekly-page">
    <header className="weekly-heading"><div><span>Rancangan lima hari</span><h1>Minggu yang lebih kering.</h1></div><button onClick={recommendation.refetch} aria-label="Muat semula"><RefreshCw className={recommendation.isFetching ? 'is-spinning' : ''} /></button></header>
    <WarningAlert />

    {recommendation.isLoading && <div className="weekly-loading">Menyusun hari terbaik…</div>}
    {recommendation.isError && recommendation.days.length === 0 && <div className="weekly-error"><span>Ramalan tidak dapat dimuatkan.</span><button onClick={recommendation.refetch}>Cuba lagi</button></div>}

    {lead && <div className="weekly-composition">
      <section className={`week-lead risk-${leadRisk}`}>
        <div className="week-lead-accent" />
        <header><div><span>{leadIsToday ? 'Hari ini' : 'Hari kerja terdekat'}</span><p>{lead.date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>{lead.isRecommended && <em>Pilihan terbaik</em>}</header>
        <div className="week-lead-copy"><h2>{names[lead.dayName]}</h2><p>{getVerdict(lead.combinedScore, config.rainThreshold)}.</p></div>
        <div className="week-lead-measures"><div><span>Rumah · pagi</span><strong>{Math.round(lead.morningScore)}%</strong><small>{config.morningWindow.start}–{config.morningWindow.end}</small></div><div><span>Pejabat · petang</span><strong>{Math.round(lead.eveningScore)}%</strong><small>{config.eveningWindow.start}–{config.eveningWindow.end}</small></div></div>
        <footer><span className="risk-name">{riskLabel[leadRisk]}</span><Link to={`/day/${lead.dateStr}`}>Lihat setiap jam<ArrowRight /></Link></footer>
      </section>

      <aside className="weekly-side">
        <div className="week-mini-grid">{following.map((day, index) => <SmallDay key={day.dateStr} day={day} threshold={config.rainThreshold} index={index} />)}</div>
        <OfficialForecast forecast={official.forecast} isLoading={official.isLoading} isError={official.isError} condensed />
      </aside>
    </div>}

    <section className="week-live-strip">
      <div className={`risk-${nowRisk}`}><i className="risk-pin" /><span>Sekarang di rumah</span><strong>{current === null ? '—' : `${Math.round(current)}%`}</strong><small>{current === null ? 'Data semasa tiada' : getVerdict(current, config.rainThreshold)}</small></div>
      {showLeave && leave && <Link to="/leave"><span>Masa balik</span><strong>{leave.recommendedTime}</strong><small>{Math.round(leave.probability)}% hujan</small><ArrowRight /></Link>}
    </section>
  </div>;
}
