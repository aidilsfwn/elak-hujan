import { copy } from '@/constants/copy';
import { useReports } from '@/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FilterBar } from './FilterBar';
import { FeedCard } from './FeedCard';
import type { ReportFilters } from '@/types/community';

interface CommunityFeedProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  userLat?: number;
  userLng?: number;
}

export function CommunityFeed({ filters, onFiltersChange, userLat, userLng }: CommunityFeedProps) {
  const { data: reports, isLoading, isError, refetch } = useReports(filters, userLat, userLng);

  return (
    <div className="flex flex-col h-full">
      <FilterBar filters={filters} onChange={onFiltersChange} />

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b">
                <Skeleton className="size-5 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-destructive">{copy.community.errorFeed}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Cuba lagi
            </Button>
          </div>
        )}

        {!isLoading && !isError && reports?.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <p className="text-sm text-muted-foreground">{copy.community.emptyFeed}</p>
          </div>
        )}

        {!isLoading && !isError && reports && reports.length > 0 && (
          <div>
            {reports.map((report) => (
              <FeedCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
