import { useQuery } from '@tanstack/react-query';
import { WEATHER_REFRESH_MINUTES } from '@/constants/thresholds';
import { buildRoutePoints, fetchRouteForecast, WEATHER_STALE_MS } from '@/services/openMeteo';
import { useConfig } from '@/hooks/useConfig';

export function useWeather() {
  const { config } = useConfig();

  const routeQuery = useQuery({
    queryKey: ['weather', 'route', config?.homeLocation.lat, config?.homeLocation.lon, config?.officeLocation.lat, config?.officeLocation.lon],
    queryFn: () => fetchRouteForecast(buildRoutePoints(config!.homeLocation, config!.officeLocation)),
    enabled: !!config?.homeLocation && !!config?.officeLocation,
    staleTime: WEATHER_STALE_MS,
    refetchInterval: WEATHER_REFRESH_MINUTES * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const routeWeather = routeQuery.data ?? [];

  return {
    routeWeather,
    homeWeather: routeWeather[0],
    officeWeather: routeWeather.at(-1),
    isLoading: routeQuery.isLoading,
    isError: routeQuery.isError,
    isFetching: routeQuery.isFetching,
    refetch: () => { void routeQuery.refetch(); },
    dataUpdatedAt: routeWeather[0]?.fetchedAt ?? null,
  };
}
