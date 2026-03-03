import { CalendarDays, RefreshCw } from 'lucide-react';
import { useDayRecommendation } from '@/hooks/useDayRecommendation';
import { useLeaveAdvisorVisible } from '@/hooks/useLeaveAdvisorVisible';
import { useConfig } from '@/hooks/useConfig';
import { useWeather } from '@/hooks/useWeather';
import { useNowcast } from '@/hooks/useNowcast';
import { DayCard } from '@/components/DayCard';
import { LeavePanel } from '@/components/LeavePanel';
import { WarningAlert } from '@/components/WarningAlert';
import { MetForecastSection } from '@/components/MetForecastSection';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { copy } from '@/constants/copy';
import { getCurrentHourProb } from '@/lib/rainScoring';
import { WEATHER_CACHE_MINUTES } from '@/constants/thresholds';
import type { WeatherData } from '@/types/weather';

function NowWidget({ homeWeather, rainThreshold }: { homeWeather: WeatherData; rainThreshold: number }) {
  const prob = getCurrentHourProb(homeWeather);
  if (prob === null) return null;

  const verdict =
    prob < rainThreshold
      ? { label: copy.weekly.nowWidget.safe, borderColor: 'border-l-green-500', dotColor: 'bg-green-500' }
      : prob < 70
      ? { label: copy.weekly.nowWidget.caution, borderColor: 'border-l-amber-500', dotColor: 'bg-amber-500' }
      : { label: copy.weekly.nowWidget.wait, borderColor: 'border-l-red-500', dotColor: 'bg-red-500' };

  return (
    <div className={`rounded-xl border-l-4 border bg-card px-4 py-3 flex items-center gap-3 ${verdict.borderColor}`}>
      <div className={`size-2 rounded-full shrink-0 ${verdict.dotColor}`} />
      <div className="flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{copy.weekly.nowWidget.title}</p>
        <p className="text-sm font-semibold leading-tight">{verdict.label}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs rounded-full bg-muted px-2 py-0.5 font-medium">
          {copy.weekly.nowWidget.probLabel(Math.round(prob))}
        </span>
        <span className="text-[9px] text-muted-foreground">Skop: lokasi rumah</span>
      </div>
    </div>
  );
}

export function Weekly() {
  const { config } = useConfig();
  const { days, isLoading, isError, isFetching, refetch } = useDayRecommendation();
  const { homeWeather, dataUpdatedAt } = useWeather();
  const showLeavePanel = useLeaveAdvisorVisible();
  const { forecast, isLoading: isForecastLoading, isError: isForecastError } = useNowcast(config?.officeLocation);

  if (!config) return null;

  const minutesAgo = dataUpdatedAt
    ? Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 60_000))
    : null;
  const isFresh = minutesAgo !== null && minutesAgo < WEATHER_CACHE_MINUTES;

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            {copy.weekly.title}
          </h1>
          {days.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {days[0].date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long' })}
              {' – '}
              {days[days.length - 1].date.toLocaleDateString('ms-MY', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
          {minutesAgo !== null && (
            <p className="flex items-center gap-1 text-[10px] mt-0.5">
              <span className={`size-1.5 rounded-full ${isFresh ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
              <span className={isFresh ? 'text-green-600' : 'text-muted-foreground'}>
                {minutesAgo === 0 ? copy.weekly.updatedNow : copy.weekly.updatedAgo(minutesAgo)}
              </span>
            </p>
          )}
        </div>
        {isFetching && !isLoading && (
          <RefreshCw className="size-4 text-muted-foreground animate-spin mt-1" />
        )}
      </div>

      {/* MET Malaysia warning banner */}
      <WarningAlert />

      {/* MET official daily forecast */}
      <MetForecastSection forecast={forecast} isLoading={isForecastLoading} isError={isForecastError} />

      {/* Right-now widget */}
      {homeWeather && !isLoading && (
        <NowWidget homeWeather={homeWeather} rainThreshold={config.rainThreshold} />
      )}

      {/* Leave panel — auto-surfaces 2h before evening window */}
      {showLeavePanel && !isLoading && !isError && <LeavePanel />}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[116px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error state — blocking only when no cached data */}
      {isError && days.length === 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm text-destructive">{copy.weekly.errorFetch}</p>
          <Button size="sm" variant="outline" onClick={refetch}>
            Cuba lagi
          </Button>
        </div>
      )}

      {/* Stale data banner — shown when error but cached data is available */}
      {isError && days.length > 0 && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">{copy.weekly.staleData}</p>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={refetch}>
            Muat semula
          </Button>
        </div>
      )}

      {/* Day cards */}
      {!isLoading && (days.length > 0) && (
        <div className="space-y-3">
          {days.map((day) => (
            <DayCard key={day.dateStr} day={day} rainThreshold={config.rainThreshold} />
          ))}
        </div>
      )}
    </div>
  );
}
