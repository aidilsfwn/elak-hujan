import { copy } from '@/constants/copy';
import { useReports } from '@/hooks/useReports';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FilterBar } from './FilterBar';
import { FeedCard } from './FeedCard';
import type { CommunityReport, ReportFilters } from '@/types/community';

interface CommunityFeedProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  onReportSelect: (report: CommunityReport) => void;
  onReset?: () => void;
  userLat?: number;
  userLng?: number;
}

export function CommunityFeed({ filters, onFiltersChange, onReportSelect, onReset, userLat, userLng }: CommunityFeedProps) {
  const { data: reports, isLoading, isError, refetch, dataUpdatedAt } = useReports(filters, userLat, userLng);

  const minutesAgo = dataUpdatedAt
    ? Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 60_000))
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{copy.community.feedTitle}</p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          {copy.community.feedLive}
          {minutesAgo !== null && (
            <span className="text-muted-foreground/70">
              {' · '}
              {minutesAgo === 0 ? 'baru' : `${minutesAgo} min lalu`}
            </span>
          )}
        </span>
      </div>
      <FilterBar filters={filters} onChange={onFiltersChange} onReset={onReset} />

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
              <FeedCard key={report.id} report={report} onSelect={() => onReportSelect(report)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
