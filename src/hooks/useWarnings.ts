import { useQuery } from '@tanstack/react-query';
import { fetchActiveWarnings, filterWarningsForRoute, WARNINGS_STALE_MS } from '@/services/dataGovMy';
import { useConfig } from './useConfig';
import type { WeatherWarning } from '@/types/warning';

export function useWarnings(): { warnings: WeatherWarning[]; isLoading: boolean; isError: boolean } {
  const { config } = useConfig();

  const query = useQuery({
    queryKey: ['warnings', 'v2'],
    queryFn: fetchActiveWarnings,
    staleTime: WARNINGS_STALE_MS,
    enabled: !!config,
  });

  return {
    warnings: config ? filterWarningsForRoute(query.data ?? [], config) : [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
