import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitReport } from '@/services/communityReports';

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_reports'] }),
  });
}
