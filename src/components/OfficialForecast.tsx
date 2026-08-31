import { Moon, Sun, Sunset } from 'lucide-react';
import type { ForecastPeriod, MetDailyForecast } from '@/types/metMalaysia';

const periodIcon: Record<ForecastPeriod['period'], typeof Sun> = { morning: Sun, afternoon: Sunset, night: Moon };

export function OfficialForecast({ forecast, isLoading, isError, condensed = false }: { forecast: MetDailyForecast | null; isLoading: boolean; isError: boolean; condensed?: boolean }) {
  if (isLoading) return <div className="official-forecast is-loading" aria-label="Memuatkan ramalan MET" />;
  if (isError) return <p className="official-unavailable">Ramalan MET tidak tersedia.</p>;
  if (!forecast) return null;
  return <section className={`official-forecast ${condensed ? 'is-condensed' : ''}`}>
    <header><div><span>Ramalan rasmi bandar</span><strong>MET Malaysia</strong></div><small>{forecast.locationName}</small></header>
    <div className="official-periods">{forecast.periods.map((period) => { const Icon = periodIcon[period.period]; return <div key={period.period}><span><Icon />{period.label}</span><p>{period.condition}</p></div>; })}</div>
    <p className="official-scope">Ramalan kualitatif untuk bandar terdekat; berbeza skop daripada peratus laluan Open-Meteo.</p>
  </section>;
}
