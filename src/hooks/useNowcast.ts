import { useQuery } from '@tanstack/react-query';
import { fetchMetTownLocations, fetchTodayForecast } from '@/services/metMalaysia';
import { NOWCAST_CACHE_MINUTES, MET_LOCATIONS_CACHE_HOURS } from '@/constants/thresholds';
import type { Location } from '@/types/config';
import type { MetLocation, MetDailyForecast } from '@/types/metMalaysia';

export function resolveNearestLocationId(
  target: Location,
  locations: MetLocation[],
): string | null {
  const candidates = locations.filter((location) => location.latitude !== null && location.longitude !== null);
  const match = candidates.reduce<MetLocation | null>((nearest, location) => {
    if (!nearest) return location;
    const distance = (candidate: MetLocation) => {
      const latDelta = candidate.latitude! - target.lat;
      const lonDelta = candidate.longitude! - target.lon;
      return latDelta * latDelta + lonDelta * lonDelta;
    };
    return distance(location) < distance(nearest) ? location : nearest;
  }, null);
  return match?.id ?? match?.locationid ?? null;
}

export function useNowcast(officeLocation: Location | undefined): {
  forecast: MetDailyForecast | null;
  isLoading: boolean;
  isError: boolean;
} {
  const enabled = !!officeLocation;

  const {
    data: townLocations = [],
    isLoading: isLocationsLoading,
    isError: isLocationsError,
  } = useQuery({
    queryKey: ['met-town-locations', 'all-v2'],
    queryFn: fetchMetTownLocations,
    staleTime: MET_LOCATIONS_CACHE_HOURS * 60 * 60 * 1000,
    retry: false,
    enabled,
  });

  const locationId =
    officeLocation && townLocations.length > 0
      ? resolveNearestLocationId(officeLocation, townLocations)
      : null;

  const {
    data: forecast = null,
    isLoading: isForecastLoading,
    isError: isForecastError,
  } = useQuery({
    queryKey: ['met-forecast', locationId],
    queryFn: () => fetchTodayForecast(locationId!),
    staleTime: NOWCAST_CACHE_MINUTES * 60 * 1000,
    retry: false,
    enabled: enabled && !!locationId,
  });

  return {
    forecast,
    isLoading: enabled && (isLocationsLoading || isForecastLoading),
    isError: enabled && (isLocationsError || isForecastError),
  };
}
