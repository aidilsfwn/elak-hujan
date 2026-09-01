import { useState } from 'react';
import { ArrowRight, Clock3, House, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { OfficialForecast } from '@/components/OfficialForecast';
import { AttendanceProgress } from '@/components/AttendanceProgress';
import { SmartBriefing } from '@/components/SmartBriefing';
import { WarningAlert } from '@/components/WarningAlert';
import { WeatherAtmosphere } from '@/components/WeatherAtmosphere';
import { useConfig } from '@/hooks/useConfig';
import { useAttendance } from '@/hooks/useAttendance';
import { useDayRecommendation } from '@/hooks/useDayRecommendation';
import { useLeaveAdvisorVisible } from '@/hooks/useLeaveAdvisorVisible';
import { useNowcast } from '@/hooks/useNowcast';
import { useWeather } from '@/hooks/useWeather';
import { getRecommendedLeaveTime } from '@/lib/leaveAdvisor';
import { getWeekKey, malaysiaNow, toLocalDateStr, type ScoredDay } from '@/lib/rainScoring';
import { getRiskLevel, getVerdict, riskLabel } from '@/lib/risk';

const names: Record<string, string> = { monday: 'Isnin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Khamis', friday: 'Jumaat' };
const probability = (value: number | null) => value === null ? '—' : `${Math.round(value)}%`;

function weekRange(days: ScoredDay[]) {
  if (!days.length) return '';
  const first = days[0].date;
  const last = days.at(-1)!.date;
  const sameMonth = first.getMonth() === last.getMonth();
  const start = first.toLocaleDateString('ms-MY', { day: 'numeric', ...(sameMonth ? {} : { month: 'short' }) });
  return `${start}–${last.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}`;
}

function SmallDay({ day, threshold, index }: { day: ScoredDay; threshold: number; index: number }) {
  const risk = getRiskLevel(day.combinedScore ?? 100, threshold);
  return <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}>
    <Link to={`/day/${day.dateStr}`} className={`week-mini risk-${risk}`}>
      <header><span>{day.date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</span>{day.isRecommended && <em>Disyorkan</em>}</header>
      <h3>{names[day.dayName]}</h3>
      <div><p><span>Laluan pagi</span><strong>{probability(day.morningScore)}</strong></p><p><span>Laluan petang</span><strong>{probability(day.eveningScore)}</strong></p></div>
      <small className="confidence-note">Keyakinan {day.confidence}</small><i className="risk-pin" />
    </Link>
  </motion.div>;
}

export function Weekly() {
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const { config } = useConfig();
  const { attendance } = useAttendance();
  const recommendation = useDayRecommendation();
  const weather = useWeather();
  const showLeave = useLeaveAdvisorVisible();
  const official = useNowcast(config?.officeLocation);
  if (!config) return null;

  const now = malaysiaNow();
  const currentWeekKey = getWeekKey(now);
  const weekMap = new Map<string, ScoredDay[]>();
  recommendation.days.forEach((day) => {
    const key = getWeekKey(day.date);
    weekMap.set(key, [...(weekMap.get(key) ?? []), day]);
  });
  const weeks = [...weekMap.entries()].map(([key, days]) => ({ key, days }));
  const activeWeekKey = selectedWeek && weekMap.has(selectedWeek)
    ? selectedWeek
    : weekMap.has(currentWeekKey) ? currentWeekKey : weeks[0]?.key;
  const activeWeek = weeks.find((week) => week.key === activeWeekKey);
  const activeIsCurrentWeek = activeWeekKey === currentWeekKey;
  const activeWeekLabel = activeIsCurrentWeek ? 'minggu ini' : 'minggu depan';
  const activeDays = activeWeek?.days ?? [];
  const availableDays = activeDays.filter((day) => day.combinedScore !== null);
  const recommendedDays = availableDays.filter((day) => day.isRecommended).sort((a, b) => a.combinedScore! - b.combinedScore!);
  const rankedAvailableDays = [...availableDays].sort((a, b) => a.combinedScore! - b.combinedScore!);
  const lead = recommendedDays[0] ?? rankedAvailableDays[0];
  const completedThisWeek = Object.values(attendance.weeks[currentWeekKey]?.statuses ?? {}).filter((status) => status === 'office').length;
  const following = activeDays.filter((day) => day.dateStr !== lead?.dateStr);
  const current = weather.homeWeather?.current;
  const currentRain = current?.precipitation ?? null;
  const currentCode = current?.weather_code ?? 0;
  const currentGust = current?.wind_gusts_10m ?? 0;
  const currentRiskScore = currentRain === null ? 100 : Math.max(currentCode >= 95 ? 90 : 0, currentRain >= 2 ? 80 : currentRain > 0 ? 55 : 0, currentGust >= 40 ? 70 : 0);
  const nowRisk = getRiskLevel(currentRiskScore, config.rainThreshold);
  const leave = weather.routeWeather.length ? getRecommendedLeaveTime(weather.routeWeather, now, config.eveningWindow, config.rainThreshold, now) : null;
  const leaveSlot = leave?.slots.find((slot) => slot.time === leave.recommendedTime);
  const leadRisk = getRiskLevel(lead?.combinedScore ?? 100, config.rainThreshold);
  const leadIsToday = lead?.dateStr === toLocalDateStr(now);

  return <div className="weekly-page">
    <header className="weekly-heading"><div><span>Rancangan mengikut minggu</span><h1>Minggu yang lebih kering.</h1></div><button onClick={recommendation.refetch} aria-label="Muat semula"><RefreshCw className={recommendation.isFetching ? 'is-spinning' : ''} /></button></header>
    <WarningAlert />

    {recommendation.isLoading && <div className="weekly-loading">Menyusun hari terbaik…</div>}
    {recommendation.isError && <div className="weekly-error"><span>Ramalan tidak dapat dimuatkan. Cadangan lama tidak digunakan.</span><button onClick={recommendation.refetch}>Cuba lagi</button></div>}
    {!recommendation.isLoading && !recommendation.isError && recommendation.days.length === 0 && <div className="weekly-error">Data ramalan lengkap tidak tersedia untuk dinilai.</div>}

    {weeks.length > 0 && <section className={`weekly-planning ${activeIsCurrentWeek ? '' : 'is-next-week'}`} aria-label="Perancangan minggu">
      <nav className="week-switcher" aria-label="Pilih minggu">{weeks.map((week) => {
        const isCurrent = week.key === currentWeekKey;
        const recommendedCount = week.days.filter((day) => day.isRecommended).length;
        return <button key={week.key} type="button" className={week.key === activeWeekKey ? 'is-active' : ''} aria-pressed={week.key === activeWeekKey} onClick={() => setSelectedWeek(week.key)}>
          <span>{isCurrent ? 'Minggu ini' : 'Minggu depan'}</span>
          <strong>{weekRange(week.days)}</strong>
          <small>{recommendedCount} hari disyorkan</small>
        </button>;
      })}</nav>
      {activeIsCurrentWeek && <AttendanceProgress target={config.officeDaysPerWeek} />}
      {activeDays.length > 0 && <SmartBriefing days={activeDays} target={config.officeDaysPerWeek} completed={activeIsCurrentWeek ? completedThisWeek : 0} isCurrentWeek={activeIsCurrentWeek} />}
    </section>}

    {activeDays.length > 0 && availableDays.length === 0 && <div className="weekly-error">Data ramalan lengkap tidak tersedia untuk minggu ini.</div>}

    {lead && <div className="weekly-composition">
      <section className={`week-lead risk-${leadRisk}`}>
        <div className="week-lead-accent" />
        <WeatherAtmosphere risk={leadRisk} thunderstorm={lead.hasThunderstorm} />
        <header><div><span>{leadIsToday ? 'Hari ini' : 'Risiko terendah'}</span><p>{lead.date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>{lead.isRecommended && <em>Pilihan terbaik {activeWeekLabel}</em>}</header>
        <div className="week-lead-copy"><h2>{names[lead.dayName]}</h2><p>{getVerdict(lead.combinedScore!, config.rainThreshold)}.</p><small>Skor {Math.round(lead.combinedScore!)} · keyakinan {lead.confidence}{lead.hasThunderstorm ? ' · ribut petir berpotensi' : ''}</small></div>
        <div className="week-lead-measures"><div><span>Laluan · pagi</span><strong>{probability(lead.morningScore)}</strong><small>Puncak {config.morningWindow.start}–{config.morningWindow.end}</small></div><div><span>Laluan · petang</span><strong>{probability(lead.eveningScore)}</strong><small>Puncak {config.eveningWindow.start}–{config.eveningWindow.end}</small></div></div>
        <footer><span className="risk-name">{riskLabel[leadRisk]}</span><Link to={`/day/${lead.dateStr}`}>Lihat setiap jam<ArrowRight /></Link></footer>
      </section>
      <aside className="weekly-side"><div className="week-mini-grid">{following.map((day, index) => <SmallDay key={day.dateStr} day={day} threshold={config.rainThreshold} index={index} />)}</div><OfficialForecast forecast={official.forecast} isLoading={official.isLoading} isError={official.isError} condensed /></aside>
    </div>}

    <section className="week-live-cards" aria-label="Ringkasan semasa">
      <article className={`week-live-card ${currentRain === null ? 'is-unavailable' : `risk-${nowRisk}`}`}>
        <header><span className="week-live-icon"><House /></span><span>Sekarang · rumah</span><i className="risk-pin" /></header>
        <div className="week-live-value"><strong>{currentRain === null ? 'Data tiada' : currentRain > 0 ? 'Hujan dikesan' : 'Tiada hujan'}</strong><span>{currentRain === null ? '—' : `${currentRain.toFixed(1)} mm`}</span></div>
        <footer>Anggaran model cuaca di lokasi rumah anda</footer>
      </article>
      {showLeave && leave && <Link to="/leave" className={`week-live-card week-leave-card risk-${getRiskLevel(leaveSlot?.riskScore ?? 100, config.rainThreshold)}`}>
        <header><span className="week-live-icon"><Clock3 /></span><span>Cadangan masa balik</span><i className="risk-pin" /></header>
        <div className="week-live-value"><strong>{leave.recommendedTime}</strong><span>{Math.round(leave.probability)}% hujan</span></div>
        <footer><span>Pilihan paling selamat di sepanjang laluan</span><i className="week-live-arrow"><ArrowRight /></i></footer>
      </Link>}
    </section>
  </div>;
}
