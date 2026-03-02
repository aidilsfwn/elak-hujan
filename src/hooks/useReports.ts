import { useQuery } from '@tanstack/react-query';
import { fetchReports } from '@/services/communityReports';
import type { ReportFilters } from '@/types/community';

export function useReports(filters: ReportFilters, userLat?: number, userLng?: number) {
  return useQuery({
    queryKey: ['community_reports', filters, userLat, userLng],
    queryFn: () => fetchReports(filters, userLat, userLng),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
}
