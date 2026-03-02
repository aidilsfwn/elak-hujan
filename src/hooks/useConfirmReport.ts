import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmReport } from '@/services/communityReports';

export function useConfirmReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: confirmReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community_reports'] }),
  });
}
