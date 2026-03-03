import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RiskBadge } from '@/components/RiskBadge';
import { useWeather } from '@/hooks/useWeather';
import { useConfig } from '@/hooks/useConfig';
import { extractWindowAverage, toLocalDateStr } from '@/lib/rainScoring';
import { getRecommendedLeaveTime } from '@/lib/leaveAdvisor';
import { copy } from '@/constants/copy';
import { cn } from '@/lib/utils';
import type { WeatherData } from '@/types/weather';

const BM_DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface HourlyBarChartProps {
  data: WeatherData;
  dateStr: string;
  morningStartH: number;
  morningEndH: number;
  eveningStartH: number;
  eveningEndH: number;
  rainThreshold: number;
  bestLeaveHour?: number;
}

function HourlyBarChart({
  data,
  dateStr,
  morningStartH,
  morningEndH,
  eveningStartH,
  eveningEndH,
  rainThreshold,
  bestLeaveHour,
}: HourlyBarChartProps) {
  const BAR_HEIGHT = 64;

  const hours = data.hourly.time
    .map((t, i) => ({ hour: parseInt(t.slice(11, 13), 10), prob: data.hourly.precipitation_probability[i] }))
    .filter((_, i) => data.hourly.time[i].slice(0, 10) === dateStr);

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex items-end gap-px" style={{ minWidth: 'max-content' }}>
        {hours.map(({ hour, prob }) => {
          const isMorning = hour >= morningStartH && hour < morningEndH;
          const isEvening = hour >= eveningStartH && hour < eveningEndH;
          const isSevere = prob >= 70;
          const isRisky = prob >= rainThreshold;
          const isBestSlot = hour === bestLeaveHour;

          return (
            <div key={hour} className="flex flex-col items-center">
              <div style={{ position: 'relative', height: `${BAR_HEIGHT + 10}px` }} className="flex items-end justify-center w-8">
                {isBestSlot && (
                  <div
                    title={copy.dayDetail.bestSlot}
                    aria-label={copy.dayDetail.bestSlot}
                    className="absolute top-0 left-1/2 -translate-x-1/2 size-2 rounded-full bg-primary ring-2 ring-primary/30"
                  />
                )}
                <div
                  className={cn(
                    'w-8 flex items-end justify-center rounded-t',
                    isMorning ? 'bg-sky-100' : isEvening ? 'bg-violet-100' : '',
                  )}
                  style={{ height: `${BAR_HEIGHT}px` }}
                >
                  {prob > 0 && (
                    <div
                      className={cn(
                        'w-[26px] rounded-t-sm transition-all',
                        isSevere ? 'bg-red-400' : isRisky ? 'bg-amber-400' : 'bg-emerald-400',
                      )}
                      style={{ height: `${(prob / 100) * BAR_HEIGHT}px` }}
                    />
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'text-[9px] mt-0.5 w-8 text-center leading-none',
                  isMorning || isEvening ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                {hour}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SummarySectionProps {
  label: string;
  note: string;
  score: number;
  rainThreshold: number;
  window: string;
}

function SummarySection({ label, note, score, rainThreshold, window }: SummarySectionProps) {
  return (
    <div className="flex-1 rounded-xl border bg-card p-3 space-y-2">
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{window} · {note}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums">{Math.round(score)}%</p>
      <RiskBadge probability={score} threshold={rainThreshold} />
    </div>
  );
}

export function DayDetail() {
  const { date: dateStr } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { homeWeather, officeWeather, isLoading } = useWeather();

  if (!config || !dateStr) return null;

  const date = parseDateStr(dateStr);
  const dayName = BM_DAYS[date.getDay()];
  const isToday = dateStr === toLocalDateStr(new Date());
  const formattedDate = date.toLocaleDateString('ms-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const morningStartH = parseInt(config.morningWindow.start.slice(0, 2), 10);
  const morningEndH = parseInt(config.morningWindow.end.slice(0, 2), 10);
  const eveningStartH = parseInt(config.eveningWindow.start.slice(0, 2), 10);
  const eveningEndH = parseInt(config.eveningWindow.end.slice(0, 2), 10);

  const morningScore = homeWeather
    ? extractWindowAverage(homeWeather, date, config.morningWindow.start, config.morningWindow.end)
    : null;
  const eveningScore = officeWeather
    ? extractWindowAverage(officeWeather, date, config.eveningWindow.start, config.eveningWindow.end)
    : null;

  const leaveRec = officeWeather
    ? getRecommendedLeaveTime(officeWeather, date, config.eveningWindow, config.rainThreshold)
    : null;
  const bestLeaveHour = leaveRec?.recommendedTime
    ? parseInt(leaveRec.recommendedTime.slice(0, 2), 10)
    : undefined;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold leading-tight">
            {dayName}
            {isToday && <span className="ml-2 text-sm font-normal text-muted-foreground">Hari ini</span>}
          </h1>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-24 flex-1 rounded-xl" />
            <Skeleton className="h-24 flex-1 rounded-xl" />
          </div>
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Summary cards */}
          <div className="flex gap-3">
            {morningScore !== null ? (
              <SummarySection
                label={copy.dayDetail.morningSection}
                note={copy.dayDetail.homeNote}
                score={morningScore}
                rainThreshold={config.rainThreshold}
                window={`${config.morningWindow.start}–${config.morningWindow.end}`}
              />
            ) : (
              <div className="flex-1 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
                {copy.dayDetail.noData}
              </div>
            )}
            {eveningScore !== null ? (
              <SummarySection
                label={copy.dayDetail.eveningSection}
                note={copy.dayDetail.officeNote}
                score={eveningScore}
                rainThreshold={config.rainThreshold}
                window={`${config.eveningWindow.start}–${config.eveningWindow.end}`}
              />
            ) : (
              <div className="flex-1 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
                {copy.dayDetail.noData}
              </div>
            )}
          </div>

          {/* 24-hour chart */}
          {officeWeather && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{copy.dayDetail.chartTitle}</p>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-100 border border-sky-200" />
                    {copy.dayDetail.legendMorning}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-100 border border-violet-200" />
                    {copy.dayDetail.legendEvening}
                  </span>
                </div>
              </div>
              <HourlyBarChart
                data={officeWeather}
                dateStr={dateStr}
                morningStartH={morningStartH}
                morningEndH={morningEndH}
                eveningStartH={eveningStartH}
                eveningEndH={eveningEndH}
                rainThreshold={config.rainThreshold}
                bestLeaveHour={bestLeaveHour}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
