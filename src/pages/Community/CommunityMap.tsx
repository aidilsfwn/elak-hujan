import { useState, useEffect, useRef } from 'react';
import { Crosshair, X, ThumbsUp, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { useReports } from '@/hooks/useReports';
import { useConfirmReport } from '@/hooks/useConfirmReport';
import { MARKER_CONFIG, SUBTYPE_LABEL } from '@/constants/communityConfig';
import { copy } from '@/constants/copy';
import type { CommunityReport, ReportFilters } from '@/types/community';

interface CommunityMapProps {
  filters: ReportFilters;
  userLat?: number;
  userLng?: number;
  height: number;
  focusTarget?: { lat: number; lng: number; id: string } | null;
}

const DEFAULT_CENTER: [number, number] = [3.147, 101.6958]; // KL
const DEFAULT_ZOOM = 12;
const RADIUS_METRES = 10_000;
const FRESH_MS = 15 * 60 * 1000; // 15 min

function makeMarkerIcon(report: CommunityReport): L.DivIcon {
  const cfg = MARKER_CONFIG[report.sub_type] ?? { emoji: '⚠️', bg: '#94a3b8' };
  const isFresh = Date.now() - new Date(report.reported_at).getTime() < FRESH_MS;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:40px;height:40px;">
        ${isFresh ? `<div style="position:absolute;inset:-6px;background:${cfg.bg}33;border-radius:50%;animation:report-ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
        <div style="
          position:relative;width:40px;height:40px;
          background:${cfg.bg};border-radius:50%;
          border:2.5px solid white;
          display:flex;align-items:center;justify-content:center;
          font-size:18px;
          box-shadow:0 2px 8px rgba(0,0,0,0.2);
          cursor:pointer;
        ">${cfg.emoji}</div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function makeUserMarker(): L.Marker {
  const icon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:28px;">
      <div style="position:absolute;inset:0;background:rgba(59,130,246,0.25);border-radius:50%;animation:user-ping 1.8s ease-out infinite;"></div>
      <div style="position:absolute;inset:5px;background:#3b82f6;border-radius:50%;border:2.5px solid white;box-shadow:0 0 14px rgba(59,130,246,0.8);"></div>
    </div>
    <style>@keyframes user-ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}</style>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  return L.marker([0, 0], { icon, zIndexOffset: 1000 });
}

export function CommunityMap({ filters, userLat, userLng, height, focusTarget }: CommunityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  const { data: reports } = useReports(filters, userLat, userLng);
  const { mutate: confirmReport, isPending: isConfirming } = useConfirmReport();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Derive live report data so confirms count updates after refetch
  const selectedReport = selectedId
    ? (reports?.find(r => r.id === selectedId) ?? null)
    : null;

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      userLat != null && userLng != null ? [userLat, userLng] : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Close selected pin when tapping map background
    map.on('click', () => setSelectedId(null));

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      userMarkerRef.current = null;
      radiusCircleRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Invalidate map size after height transition completes
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [height]);

  // Fly to a selected report pin
  useEffect(() => {
    if (!mapRef.current || !focusTarget) return;
    mapRef.current.flyTo([focusTarget.lat, focusTarget.lng], 15, { animate: true, duration: 0.8 });
  }, [focusTarget]);

  // Update user location marker + radius circle
  useEffect(() => {
    if (!mapRef.current || userLat == null || userLng == null) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = makeUserMarker().addTo(mapRef.current);
    }
    userMarkerRef.current.setLatLng([userLat, userLng]);

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }
    if (filters.lokasi === 'berhampiran') {
      radiusCircleRef.current = L.circle([userLat, userLng], {
        radius: RADIUS_METRES,
        color: '#22c55e',
        weight: 1.5,
        dashArray: '6 6',
        fillColor: '#22c55e',
        fillOpacity: 0.04,
      }).addTo(mapRef.current);
    }
  }, [userLat, userLng, filters.lokasi]);

  // Update markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();
    reports?.forEach((report) => {
      const marker = L.marker([report.lat, report.lng], { icon: makeMarkerIcon(report) });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedId(report.id);
      });
      marker.addTo(markersRef.current!);
    });
  }, [reports]);

  function recenter() {
    if (!mapRef.current) return;
    const center: [number, number] =
      userLat != null && userLng != null ? [userLat, userLng] : DEFAULT_CENTER;
    mapRef.current.setView(center, DEFAULT_ZOOM);
  }

  const cfg = selectedReport
    ? (MARKER_CONFIG[selectedReport.sub_type] ?? { emoji: '⚠️', bg: '#94a3b8' })
    : null;

  const minutesAgo = selectedReport
    ? Math.max(1, Math.floor((Date.now() - new Date(selectedReport.reported_at).getTime()) / 60_000))
    : 0;

  return (
    <>
      <style>{`
        .leaflet-control-attribution {
          font-size: 8px !important;
          opacity: 0.4 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 4px !important;
        }
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out {
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
          background: rgba(255,255,255,0.9) !important;
          backdrop-filter: blur(4px) !important;
          -webkit-backdrop-filter: blur(4px) !important;
          border-radius: 8px !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05) !important;
          color: #4b5563 !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          transition: transform 0.15s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .leaflet-control-zoom-in:active,
        .leaflet-control-zoom-out:active {
          transform: scale(0.95) !important;
        }
        @keyframes report-ping {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <div style={{ position: 'relative', height, width: '100%', transition: 'height 0.35s ease' }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

        {/* Recenter button */}
        <button
          onClick={recenter}
          title="Pergi ke lokasi semasa"
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 1000 }}
          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm active:scale-95 transition-transform"
        >
          <Crosshair className="size-3.5 text-gray-600" />
        </button>

        {/* Selected report card */}
        {selectedReport && cfg && (
          <div
            style={{ position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 1000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Info row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div
                  className="size-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ background: cfg.bg + '22' }}
                >
                  {cfg.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    {SUBTYPE_LABEL[selectedReport.sub_type] ?? selectedReport.sub_type}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedReport.state} · {copy.community.reportedAgo(minutesAgo)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="size-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 shrink-0"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Confirm row */}
              <div className="border-t border-gray-100 px-4 py-2.5">
                <button
                  onClick={() => confirmReport(selectedReport.id)}
                  disabled={isConfirming}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ background: cfg.bg + '18', color: cfg.bg }}
                >
                  {isConfirming
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <ThumbsUp className="size-3.5" />}
                  {selectedReport.confirms > 0
                    ? `${copy.community.confirmsCount(selectedReport.confirms)} · ${copy.community.confirmButton}`
                    : copy.community.confirmButton}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
