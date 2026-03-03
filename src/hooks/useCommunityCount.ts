import { useConfig } from '@/hooks/useConfig';
import { useReports } from '@/hooks/useReports';

export function useCommunityCount(): number {
  const { config } = useConfig();
  const state = config?.homeLocation.state;

  const { data } = useReports(
    { jenis: 'semua', masa: 60, lokasi: state ?? 'berhampiran' },
    undefined,
    undefined,
  );

  return data?.length ?? 0;
}
