import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConfig } from '@/hooks/useConfig';
import { useWeather } from '@/hooks/useWeather';
import { getRecommendedLeaveTime } from '@/lib/leaveAdvisor';
import { extractWindowAverage, toLocalDateStr } from '@/lib/rainScoring';
import { getRiskLevel, getVerdict, riskLabel } from '@/lib/risk';

const names = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
function parseDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); }

export function DayDetail() {
  const { date: dateString } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { homeWeather, officeWeather, isLoading } = useWeather();
  if (!config || !dateString) return null;

  const date = parseDate(dateString);
  const morning = homeWeather ? extractWindowAverage(homeWeather, date, config.morningWindow.start, config.morningWindow.end) : 0;
  const evening = officeWeather ? extractWindowAverage(officeWeather, date, config.eveningWindow.start, config.eveningWindow.end) : 0;
  const combined = (morning + evening) / 2;
  const risk = getRiskLevel(combined, config.rainThreshold);
  const leave = officeWeather ? getRecommendedLeaveTime(officeWeather, date, config.eveningWindow, config.rainThreshold) : null;
  const hours = officeWeather?.hourly.time.map((time, index) => ({ time, hour: Number(time.slice(11, 13)), probability: officeWeather.hourly.precipitation_probability[index] })).filter((item) => item.time.slice(0, 10) === dateString) ?? [];

  return <div className={`day-page risk-${risk}`}>
    <button className="day-back" onClick={() => navigate(-1)}><ArrowLeft />Kembali ke minggu</button>
    <div className="day-layout">
      <motion.section className="day-intro" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
        <span>{dateString === toLocalDateStr(new Date()) ? 'Hari ini' : date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <h1>{names[date.getDay()]}</h1>
        <p>{getVerdict(combined, config.rainThreshold)}.</p>
        <em>{riskLabel[risk]}</em>
      </motion.section>
      <section className="day-commutes"><div><span>Rumah · pagi</span><strong>{Math.round(morning)}%</strong><small>{config.morningWindow.start}–{config.morningWindow.end}</small></div><div><span>Pejabat · petang</span><strong>{Math.round(evening)}%</strong><small>{config.eveningWindow.start}–{config.eveningWindow.end}</small></div>{leave && <footer><span>Masa balik terbaik</span><strong>{leave.recommendedTime}</strong></footer>}</section>
    </div>
    {isLoading ? <div className="day-loading">Memuatkan setiap jam…</div> : <section className="day-hours"><header><div><span>Sejam demi sejam</span><h2>Kebarangkalian hujan</h2></div><small>Pejabat · 24 jam</small></header><div className="day-hour-scroll"><div className="day-hour-plot">{hours.map(({ hour, probability }) => { const hourRisk = getRiskLevel(probability, config.rainThreshold); const selected = leave?.recommendedTime === `${String(hour).padStart(2, '0')}:00`; return <div key={hour} className={`risk-${hourRisk} ${selected ? 'is-selected' : ''}`}><span>{String(hour).padStart(2, '0')}</span><i style={{ height: `${Math.max(5, probability)}px` }} /><strong>{Math.round(probability)}%</strong></div>; })}</div></div></section>}
  </div>;
}
