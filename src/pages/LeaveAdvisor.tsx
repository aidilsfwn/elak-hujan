import { AlertTriangle, ArrowLeft, Clock, Navigation, RefreshCw, Thermometer, Umbrella } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RainBar } from '@/components/RainBar';
import { RideabilityBadge } from '@/components/RideabilityBadge';
import { GearCheckPanel } from '@/components/GearCheckPanel';
import { useWeather } from '@/hooks/useWeather';
import { useConfig } from '@/hooks/useConfig';
import { getRecommendedLeaveTime, getRollingSlots } from '@/lib/leaveAdvisor';
import { toLocalDateStr } from '@/lib/rainScoring';
import { copy } from '@/constants/copy';
import { WEATHER_CACHE_MINUTES } from '@/constants/thresholds';
import { cn } from '@/lib/utils';

function SlotRow({
  time,
  probability,
  rainThreshold,
  isRecommended,
}: {
  time: string;
  probability: number;
  rainThreshold: number;
  isRecommended: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-2.5',
        isRecommended ? 'bg-primary/5 border-primary/30' : 'bg-card',
      )}
    >
      <span className="text-sm font-medium w-12 tabular-nums shrink-0">{time}</span>
      <RainBar probability={probability} threshold={rainThreshold} className="flex-1" />
      <span className="text-sm tabular-nums w-9 text-right text-muted-foreground shrink-0">
        {Math.round(probability)}%
      </span>
      {isRecommended && (
        <ArrowLeft className="size-3.5 text-primary shrink-0" />
      )}
    </div>
  );
}

export function LeaveAdvisor() {
  const { config } = useConfig();
  const { officeWeather, isLoading, isError, refetch, dataUpdatedAt } = useWeather();

  if (!config) return null;

  const today = new Date();
  const currentHour = today.getHours();

  const rec = officeWeather
    ? getRecommendedLeaveTime(officeWeather, today, config.eveningWindow, config.rainThreshold)
    : null;

  const rollingSlots = officeWeather
    ? getRollingSlots(officeWeather, today, currentHour, 4)
    : [];

  // Current temperature from office weather
  const currentTempIndex = officeWeather?.hourly.time.findIndex(
    (t) => t.startsWith(toLocalDateStr(today)) && parseInt(t.slice(11, 13)) === currentHour,
  ) ?? -1;
  const currentTemp =
    currentTempIndex >= 0 && officeWeather?.hourly.temperature_2m
      ? Math.round(officeWeather.hourly.temperature_2m[currentTempIndex])
      : null;

  // Data freshness
  const minutesAgo = dataUpdatedAt
    ? Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 60_000))
    : null;
  const isFresh = minutesAgo !== null && minutesAgo < WEATHER_CACHE_MINUTES;

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Navigation className="size-5 text-primary" />
          {copy.leaveAdvisor.title}
        </h1>
        <div className="flex items-center gap-2">
          {currentTemp !== null && (
            <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-xs">
              <Thermometer className="size-3 text-muted-foreground" />
              {copy.leaveAdvisor.tempLabel(currentTemp)}
            </span>
          )}
          {minutesAgo !== null && (
            <span className={`flex items-center gap-1 text-[10px] ${isFresh ? 'text-green-600' : 'text-muted-foreground'}`}>
              <span className={`size-1.5 rounded-full ${isFresh ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
              {minutesAgo === 0 ? copy.weekly.updatedNow : copy.weekly.updatedAgo(minutesAgo)}
            </span>
          )}
          <Button size="icon-sm" variant="ghost" onClick={refetch} aria-label={copy.leaveAdvisor.refresh}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm text-destructive">{copy.errors.weatherFetch}</p>
          <Button size="sm" variant="outline" onClick={refetch}>Cuba lagi</Button>
        </div>
      )}

      {/* No office weather */}
      {!isLoading && !isError && !officeWeather && (
        <p className="text-sm text-muted-foreground">{copy.leaveAdvisor.noOfficeWeather}</p>
      )}

      {!isLoading && !isError && rec && (
        <>
          {/* Recommendation card */}
          <div
            className={cn(
              'rounded-2xl p-5 space-y-3',
              rec.hasCleanWindow
                ? 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-blue-500/25'
                : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25',
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 flex items-center gap-1.5">
              <Umbrella className="size-3.5" />
              {copy.leaveAdvisor.recommendedSlot}
            </p>
            <p className="text-5xl font-bold tabular-nums tracking-tight text-white">
              {rec.recommendedTime}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-xs font-semibold text-white">
                {Math.round(rec.probability)}% hujan
              </span>
              {!rec.hasCleanWindow && (
                <span className="text-xs text-white/90 font-medium flex items-center gap-1">
                  <AlertTriangle className="size-3.5" />
                  {copy.leaveAdvisor.noDryWindow}
                </span>
              )}
            </div>
            <RideabilityBadge probability={rec.probability} />
          </div>

          {/* Gear check panel */}
          <GearCheckPanel probability={rec.probability} rainThreshold={config.rainThreshold} />

          {/* Scan window slots */}
          {rec.slots.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {copy.leaveAdvisor.scanWindowTitle}
              </p>
              <div className="space-y-1.5">
                {rec.slots.map((slot) => (
                  <SlotRow
                    key={slot.hour}
                    time={slot.time}
                    probability={slot.probability}
                    rainThreshold={config.rainThreshold}
                    isRecommended={slot.time === rec.recommendedTime}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Rolling slots from now (only when outside scan window) */}
          {rollingSlots.length > 0 &&
            !rec.slots.some((s) => s.hour === currentHour) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {copy.leaveAdvisor.rollingTitle}
              </p>
              <div className="space-y-1.5">
                {rollingSlots.map((slot) => (
                  <SlotRow
                    key={slot.hour}
                    time={slot.time}
                    probability={slot.probability}
                    rainThreshold={config.rainThreshold}
                    isRecommended={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
