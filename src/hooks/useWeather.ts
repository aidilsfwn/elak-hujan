import { useQuery } from '@tanstack/react-query';
import { fetchHourlyForecast, WEATHER_STALE_MS } from '@/services/openMeteo';
import { useConfig } from '@/hooks/useConfig';

export function useWeather() {
  const { config } = useConfig();

  const homeQuery = useQuery({
    queryKey: ['weather', 'home', config?.homeLocation.lat, config?.homeLocation.lon],
    queryFn: () => fetchHourlyForecast(config!.homeLocation.lat, config!.homeLocation.lon),
    enabled: !!config?.homeLocation,
    staleTime: WEATHER_STALE_MS,
  });

  const officeQuery = useQuery({
    queryKey: ['weather', 'office', config?.officeLocation.lat, config?.officeLocation.lon],
    queryFn: () => fetchHourlyForecast(config!.officeLocation.lat, config!.officeLocation.lon),
    enabled: !!config?.officeLocation,
    staleTime: WEATHER_STALE_MS,
  });

  const timestamps = [homeQuery.dataUpdatedAt, officeQuery.dataUpdatedAt].filter((t) => t > 0);
  const dataUpdatedAt = timestamps.length > 0 ? Math.min(...timestamps) : null;

  return {
    homeWeather: homeQuery.data,
    officeWeather: officeQuery.data,
    isLoading: homeQuery.isLoading || officeQuery.isLoading,
    isError: homeQuery.isError || officeQuery.isError,
    isFetching: homeQuery.isFetching || officeQuery.isFetching,
    refetch: () => { homeQuery.refetch(); officeQuery.refetch(); },
    dataUpdatedAt,
  };
}
