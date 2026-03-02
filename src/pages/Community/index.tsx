import { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { copy } from '@/constants/copy';
import { cn } from '@/lib/utils';
import { CommunityMap } from './CommunityMap';
import { CommunityFeed } from './CommunityFeed';
import { ReportSheet } from './ReportSheet';
import type { ReportFilters } from '@/types/community';

type SubNav = 'peta' | 'suapan';

const DEFAULT_FILTERS: ReportFilters = {
  jenis: 'semua',
  masa: 60,
  lokasi: 'berhampiran',
};

export function Community() {
  const [subNav, setSubNav] = useState<SubNav>('suapan');
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {}, // silent fail — filters still work via state
    );
  }, []);

  function handleReportSuccess() {
    // Queries auto-invalidate via useSubmitReport — nothing extra needed
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h1 className="text-xl font-bold">Komuniti</h1>
      </div>

      {/* Sub-nav */}
      <div className="flex border-b px-4">
        {(['suapan', 'peta'] as SubNav[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubNav(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              subNav === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground',
            )}
          >
            {tab === 'peta' ? copy.community.subNavMap : copy.community.subNavFeed}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {subNav === 'suapan' && (
          <CommunityFeed
            filters={filters}
            onFiltersChange={setFilters}
            userLat={userLat}
            userLng={userLng}
          />
        )}
        {subNav === 'peta' && (
          <CommunityMap filters={filters} userLat={userLat} userLng={userLng} />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-20 right-4 z-20 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg font-medium text-sm"
      >
        <Plus className="size-4" />
        {copy.community.fab}
      </button>

      <ReportSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handleReportSuccess}
      />
    </div>
  );
}
