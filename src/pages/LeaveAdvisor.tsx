import { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { OfficialForecast } from '@/components/OfficialForecast';
import { WarningAlert } from '@/components/WarningAlert';
import { WeatherAtmosphere } from '@/components/WeatherAtmosphere';
import { WeekRail } from '@/components/WeekRail';
import { useConfig } from '@/hooks/useConfig';
import { useDayRecommendation } from '@/hooks/useDayRecommendation';
import { useNowcast } from '@/hooks/useNowcast';
import { useWarnings } from '@/hooks/useWarnings';
import { useWeather } from '@/hooks/useWeather';
import { getRecommendedLeaveTime, getRollingSlots } from '@/lib/leaveAdvisor';
import { malaysiaNow, toLocalDateStr } from '@/lib/rainScoring';
import { getRiskLevel, riskLabel } from '@/lib/risk';

export function LeaveAdvisor() {
  const { config } = useConfig();
  const weather = useWeather();
  const { days } = useDayRecommendation();
  const { warnings } = useWarnings();
  const official = useNowcast(config?.officeLocation);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  if (!config) return null;

  const now = malaysiaNow();
  const recommendation = weather.routeWeather.length ? getRecommendedLeaveTime(weather.routeWeather, now, config.eveningWindow, config.rainThreshold, now) : null;
  const upcoming = weather.routeWeather.length ? getRollingSlots(weather.routeWeather, now, now.getHours(), 4) : [];
  const slots = recommendation?.slots ?? upcoming;
  const selectedSlot = recommendation?.slots.find((slot) => slot.time === recommendation.recommendedTime);
  const risk = getRiskLevel(selectedSlot?.riskScore ?? 100, config.rainThreshold, warnings.length > 0);
  const index = weather.officeWeather?.hourly.time.findIndex((time) => time.startsWith(toLocalDateStr(now)) && Number(time.slice(11, 13)) === now.getHours()) ?? -1;
  const temperatureValue = index >= 0 ? weather.officeWeather?.hourly.temperature_2m?.[index] : undefined;
  const temperature = typeof temperatureValue === 'number' ? Math.round(temperatureValue) : null;
  const period = now.getHours() < 12 ? 'Pagi' : now.getHours() < 19 ? 'Petang' : 'Malam';
  const officialCondition = official.forecast?.periods.find((item) => item.label === period)?.condition;
  const verdict = recommendation ? recommendation.hasCleanWindow ? 'Waktu terawal dengan risiko rendah.' : 'Risiko kekal tinggi.' : weather.isLoading ? 'Sedang membaca ramalan.' : 'Tetingkap balik sudah tamat.';
  const tips = (recommendation?.probability ?? 0) >= 70 ? ['Sarungkan baju hujan sebelum bergerak.', 'Kurangkan kelajuan dan elak kawasan rendah.'] : (recommendation?.probability ?? 0) >= config.rainThreshold ? ['Simpan baju hujan dalam capaian.', 'Beri ruang membrek lebih panjang.'] : ['Laluan dijangka selesa untuk perjalanan.'];
  const updated = weather.dataUpdatedAt ? Math.max(0, Math.floor((now.getTime() - weather.dataUpdatedAt) / 60000)) : null;

  return <div className={`verdict-layout risk-${risk}`}>
    <div className="verdict-column">
      <section className="verdict-stage">
        <AnimatePresence mode="wait"><motion.div key={risk} className={`verdict-atmosphere tone-${risk}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .4, ease: 'easeInOut' }} /></AnimatePresence>
        <WeatherAtmosphere risk={risk} thunderstorm={(selectedSlot?.weatherCode ?? 0) >= 95 || warnings.length > 0} variant="verdict" />
        <div className="verdict-stage-inner">
          <header className="verdict-meta"><div><span>Ramalan masa balik · seluruh laluan</span><strong>{config.officeLocation.name}</strong></div><button onClick={weather.refetch} aria-label="Muat semula ramalan"><RefreshCw className={weather.isFetching ? 'is-spinning' : ''} /></button></header>
          <WarningAlert inset />
          <motion.div className="verdict-message" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>
            <h1>{verdict}</h1>
            {recommendation && <motion.div key={`${recommendation.recommendedTime}-${recommendation.probability}`} className="verdict-number" initial={{ opacity: .5, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 480, damping: 34 }}><strong>{recommendation.recommendedTime}</strong><span>{Math.round(recommendation.probability)}% hujan · {riskLabel[risk]}</span></motion.div>}
            <p>{officialCondition ? `MET bandar terdekat: ${period} — ${officialCondition}.` : `Ramalan Open-Meteo untuk ${period.toLowerCase()}.`}{temperature !== null ? ` ${temperature}°C di pejabat sekarang.` : ''}</p>
          </motion.div>
        </div>

        {!weather.isLoading && !weather.isError && slots.length > 0 && <div className="hour-ribbon"><div className="hour-ribbon-label"><span>{recommendation ? 'Pilihan masa yang masih boleh diambil' : 'Empat jam seterusnya'}</span><small>{recommendation ? 'Titik menandakan masa yang disyorkan' : 'Tiada pilihan dalam tetingkap balik'}</small></div><div className="hour-ribbon-values">{slots.map((slot) => { const slotRisk = getRiskLevel(slot.riskScore, config.rainThreshold); const selected = slot.time === recommendation?.recommendedTime; return <div className={`risk-${slotRisk} ${selected ? 'is-selected' : ''}`} key={slot.hour}><span>{slot.time}</span><i style={{ height: `${Math.max(5, slot.riskScore * .42)}px` }} /><strong>{Math.round(slot.probability)}%</strong></div>; })}</div></div>}
      </section>

      {weather.isLoading && <div className="verdict-status">Mengira masa terbaik…</div>}
      {weather.isError && <div className="verdict-status"><span>Data cuaca tidak dapat dimuatkan.</span><button onClick={weather.refetch}>Cuba lagi</button></div>}
      {!weather.isLoading && !weather.isError && !recommendation && <div className="verdict-status">Tiada lagi masa yang boleh dicadangkan dalam tetingkap hari ini.</div>}

      {recommendation && <section className="ride-note"><div><span>Bagaimana masa ini dipilih</span><p>{recommendation.hasCleanWindow ? 'Masa terawal di bawah had anda dipilih dalam tetingkap perjalanan.' : 'Semua masa dalam tetingkap melebihi had anda; pilihan paling rendah risiko ditunjukkan.'}</p><small>{updated === 0 ? 'Baru dimuat turun' : updated !== null ? `${updated} minit sejak dimuat turun` : 'Masa kemas kini tidak tersedia'} · Had {config.rainThreshold}% · Open-Meteo</small></div><button onClick={() => setGuidanceOpen((value) => !value)} aria-expanded={guidanceOpen}>Semak gear<ChevronDown className={guidanceOpen ? 'is-open' : ''} /></button><AnimatePresence initial={false}>{guidanceOpen && <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{tips.map((tip) => <li key={tip}>{tip}</li>)}</motion.ul>}</AnimatePresence></section>}
    </div>

    <aside className="context-column"><div className="context-week"><WeekRail days={days} threshold={config.rainThreshold} /></div><OfficialForecast forecast={official.forecast} isLoading={official.isLoading} isError={official.isError} /></aside>
  </div>;
}
