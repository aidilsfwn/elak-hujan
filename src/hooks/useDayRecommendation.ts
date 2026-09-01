import { useMemo } from 'react';
import { useWeather } from './useWeather';
import { useConfig } from './useConfig';
import { useAttendance } from './useAttendance';
import { completedAttendanceDates } from '@/lib/attendanceStorage';
import { scoreDays, getRecommendedDays, type ScoredDay } from '@/lib/rainScoring';

export function useDayRecommendation(): {
  days: ScoredDay[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => void;
} {
  const { routeWeather, isLoading, isError, isFetching, refetch } = useWeather();
  const { config } = useConfig();
  const { attendance } = useAttendance();

  const days = useMemo(() => {
    if (routeWeather.length === 0 || !config) return [];
    const scored = scoreDays(routeWeather, config);
    return getRecommendedDays(scored, config.officeDaysPerWeek, config.preferredDays, completedAttendanceDates(attendance));
  }, [routeWeather, config, attendance]);

  return { days, isLoading, isError, isFetching, refetch };
}
