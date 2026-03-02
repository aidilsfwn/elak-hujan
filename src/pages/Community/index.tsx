import { useEffect, useState } from 'react';
import { Users, Plus, Minimize2, Maximize2 } from 'lucide-react';
import { copy } from '@/constants/copy';
import { CommunityMap } from './CommunityMap';
import { CommunityFeed } from './CommunityFeed';
import { ReportSheet } from './ReportSheet';
import type { ReportFilters } from '@/types/community';

const DEFAULT_FILTERS: ReportFilters = {
  jenis: 'semua',
  masa: 60,
  lokasi: 'berhampiran',
};

const MAP_HEIGHT_COLLAPSED = 220;
const MAP_HEIGHT_EXPANDED = 380;

export function Community() {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();

  const mapHeight = mapExpanded ? MAP_HEIGHT_EXPANDED : MAP_HEIGHT_COLLAPSED;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {},
    );
  }, []);

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h1 className="text-xl font-bold">Komuniti</h1>
      </div>

      {/* Map section */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden border relative">
        <CommunityMap
          filters={filters}
          userLat={userLat}
          userLng={userLng}
          height={mapHeight}
        />
        {/* Expand / collapse */}
        <button
          onClick={() => setMapExpanded((v) => !v)}
          title={mapExpanded ? 'Kecilkan peta' : 'Besarkan peta'}
          style={{ position: 'absolute', top: 8, left: 8, zIndex: 1000 }}
          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm active:scale-95 transition-transform"
        >
          {mapExpanded
            ? <Minimize2 className="size-3.5 text-gray-600" />
            : <Maximize2 className="size-3.5 text-gray-600" />}
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <CommunityFeed
          filters={filters}
          onFiltersChange={setFilters}
          userLat={userLat}
          userLng={userLng}
        />
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
        onSuccess={() => {}}
      />
    </div>
  );
}
