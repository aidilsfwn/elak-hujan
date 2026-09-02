import { useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfig } from '@/hooks/useConfig';
import { useWeather } from '@/hooks/useWeather';
import { getRecommendedLeaveTime } from '@/lib/leaveAdvisor';
import { assessRouteWindow, getRouteHourly, malaysiaNow, timeToMinutes, toLocalDateStr } from '@/lib/rainScoring';
import { getRiskLevel, getVerdict, riskLabel } from '@/lib/risk';
import { assessWeather } from '@/lib/weatherAssessment';

const names = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
function parseDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); }
const formatProbability = (value: number | null) => value === null ? '—' : `${Math.round(value)}%`;

export function DayDetail() {
  const { date: dateString } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { config } = useConfig();
  const weather = useWeather();
  const scrollRef = useRef<HTMLDivElement>(null);
  const date = parseDate(dateString ?? 'invalid');
  const validDate = Boolean(dateString && !Number.isNaN(date.getTime()) && toLocalDateStr(date) === dateString);
  const morning = config && validDate ? assessRouteWindow(weather.routeWeather, date, config.morningWindow.start, config.morningWindow.end) : null;
  const evening = config && validDate ? assessRouteWindow(weather.routeWeather, date, config.eveningWindow.start, config.eveningWindow.end) : null;
  const morningRisk = morning?.riskScore;
  const eveningRisk = evening?.riskScore;
  const complete = typeof morningRisk === 'number' && typeof eveningRisk === 'number';
  const hasHardHazard = Boolean(morning?.hasHardHazard || evening?.hasHardHazard);
  const baseScore = complete ? Math.max(morningRisk, eveningRisk) * .75 + Math.min(morningRisk, eveningRisk) * .25 : null;
  const combined = baseScore === null ? null : hasHardHazard ? Math.max(90, baseScore) : baseScore;
  const risk = getRiskLevel(combined ?? 100, config?.rainThreshold ?? 40);
  const leave = config && validDate && weather.routeWeather.length ? getRecommendedLeaveTime(weather.routeWeather, date, config.eveningWindow, config.rainThreshold) : null;
  const leaveSlot = leave?.slots.find((slot) => slot.time === leave.recommendedTime);
  const leaveHardStop = leaveSlot?.assessment.hardStop ?? false;
  const hours = validDate && dateString ? getRouteHourly(weather.routeWeather, dateString) : [];
  const selectedHour = leave ? Number(leave.recommendedTime.slice(0, 2)) : config ? timeToMinutes(config.morningWindow.start) / 60 : 8;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || hours.length === 0) return;
    const target = container.querySelector<HTMLElement>(`[data-hour="${Math.floor(selectedHour)}"]`);
    if (target) container.scrollLeft = Math.max(0, target.offsetLeft - container.clientWidth / 2);
  }, [hours.length, selectedHour]);

  if (!config || !dateString) return null;

  return <div className={`day-page risk-${risk}`}>
    <button className="day-back" onClick={() => navigate('/')}><ArrowLeft />Kembali ke minggu</button>
    {!validDate ? <div className="day-loading">Tarikh tidak sah.</div> : weather.isLoading ? <div className="day-loading">Memuatkan data laluan…</div> : weather.isError ? <div className="day-loading">Ramalan tidak dapat dimuatkan. Data lama tidak digunakan.</div> : !complete ? <div className="day-loading">Data lengkap tidak tersedia untuk tarikh ini.</div> : <>
      <div className="day-layout">
        <motion.section className="day-intro" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <span>{dateString === toLocalDateStr(malaysiaNow()) ? 'Hari ini' : date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <h1>{names[date.getDay()]}</h1><p>{getVerdict(combined!, config.rainThreshold)}.</p><em>{riskLabel[risk]}</em>
          <small className="day-method">Skor menekankan perjalanan yang paling berisiko, hujan lebat, ribut petir dan angin di lima titik laluan.</small>
        </motion.section>
        <section className="day-commutes"><div><span>Laluan · pagi</span><strong>{formatProbability(morning!.peakProbability)}</strong><small>Peluang tertinggi · {config.morningWindow.start}–{config.morningWindow.end}</small></div><div><span>Laluan · petang</span><strong>{formatProbability(evening!.peakProbability)}</strong><small>Peluang tertinggi · {config.eveningWindow.start}–{config.eveningWindow.end}</small></div>{leave && <footer><span>{leaveHardStop ? 'Masa untuk rujukan sahaja' : 'Masa balik disyorkan'}</span><strong>{leave.recommendedTime}</strong></footer>}</section>
      </div>
      <section className="day-hours"><header><div><span>Sejam demi sejam</span><h2>Risiko tertinggi di sepanjang laluan</h2></div><small>Seret untuk melihat · label ialah masa bertolak</small></header><div className="day-hour-scroll" ref={scrollRef}><div className="day-hour-plot">{hours.filter(({ hour }) => hour > 0).map(({ hour, probability, precipitationMm, showersMm, gustKmh, weatherCode }) => { const departureHour = hour - 1; const assessment = assessWeather({ probability, precipitationMm, showersMm, gustKmh, weatherCode, threshold: config.rainThreshold }); const value = probability === null ? 100 : assessment.riskScore; const hourRisk = getRiskLevel(value, config.rainThreshold); const selected = leave && !leaveHardStop ? Number(leave.recommendedTime.slice(0, 2)) === departureHour : false; const departureMinutes = departureHour * 60; const morningBand = departureMinutes >= timeToMinutes(config.morningWindow.start) && departureMinutes < timeToMinutes(config.morningWindow.end); const eveningBand = departureMinutes >= timeToMinutes(config.eveningWindow.start) && departureMinutes < timeToMinutes(config.eveningWindow.end); return <div data-hour={departureHour} key={hour} className={`risk-${hourRisk} ${selected ? 'is-selected' : ''} ${morningBand ? 'is-morning' : ''} ${eveningBand ? 'is-evening' : ''}`}><span>{String(departureHour).padStart(2, '0')}</span><i style={{ height: `${Math.max(5, value)}px` }} /><strong>{probability === null ? '—' : `${Math.round(probability)}%`}</strong></div>; })}</div></div><div className="day-chart-legend"><span className="is-morning">Pagi</span><span className="is-evening">Petang</span><span>Peratus = peluang tertinggi antara lima titik laluan</span></div></section>
    </>}
  </div>;
}
