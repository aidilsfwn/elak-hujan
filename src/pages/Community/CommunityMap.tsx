import { useEffect, useRef } from 'react';
import { Crosshair } from 'lucide-react';
import L from 'leaflet';
import { useReports } from '@/hooks/useReports';
import type { CommunityReport, ReportFilters } from '@/types/community';

interface CommunityMapProps {
  filters: ReportFilters;
  userLat?: number;
  userLng?: number;
  height: number;
}

const DEFAULT_CENTER: [number, number] = [3.147, 101.6958]; // KL
const DEFAULT_ZOOM = 12;
const RADIUS_METRES = 10_000;

const MARKER_CONFIG: Record<string, { emoji: string; bg: string; glow: string }> = {
  renyai:        { emoji: '🌦️', bg: '#3b82f6', glow: '#3b82f6' },
  sederhana:     { emoji: '🌧️', bg: '#3b82f6', glow: '#3b82f6' },
  lebat:         { emoji: '⛈️', bg: '#ef4444', glow: '#ef4444' },
  banjir_kilat:  { emoji: '🌊', bg: '#ef4444', glow: '#ef4444' },
  jalan_banjir:  { emoji: '🚧', bg: '#f97316', glow: '#f97316' },
  pokok_tumbang: { emoji: '🌳', bg: '#f97316', glow: '#f97316' },
  lain:          { emoji: '⚠️', bg: '#94a3b8', glow: '#94a3b8' },
};

function makeReportMarker(report: CommunityReport): L.Marker {
  const cfg = MARKER_CONFIG[report.sub_type] ?? { emoji: '⚠️', bg: '#94a3b8', glow: '#94a3b8' };

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;
      background:${cfg.bg};
      border-radius:50%;
      border:2.5px solid rgba(255,255,255,0.35);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
      box-shadow:0 0 12px ${cfg.glow}99,0 2px 6px rgba(0,0,0,0.5);
      cursor:pointer;
    ">${cfg.emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  const minutesAgo = Math.max(
    1,
    Math.floor((Date.now() - new Date(report.reported_at).getTime()) / 60_000),
  );
  const timeLabel =
    minutesAgo < 60 ? `${minutesAgo} min lalu` : `${Math.floor(minutesAgo / 60)} jam lalu`;
  const confirmsLine = report.confirms > 0
    ? `<span style="color:#94a3b8;font-size:11px">${report.confirms} sahkan</span>`
    : '';

  return L.marker([report.lat, report.lng], { icon }).bindPopup(
    `<div style="font-size:13px;line-height:1.5;background:#1e293b;color:#e2e8f0;border-radius:8px;padding:8px 10px;min-width:120px;">
      <div style="font-weight:700;margin-bottom:2px">${cfg.emoji} ${report.sub_type.replace(/_/g, ' ')}</div>
      <div style="color:#94a3b8;font-size:11px">${report.state} · ${timeLabel}</div>
      ${confirmsLine}
    </div>`,
    { maxWidth: 180, className: 'dark-popup' },
  );
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

export function CommunityMap({ filters, userLat, userLng, height }: CommunityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  const { data: reports } = useReports(filters, userLat, userLng);

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

    // Minimal attribution — required by terms, styled to be unobtrusive
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

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
    reports?.forEach((r) => makeReportMarker(r).addTo(markersRef.current!));
  }, [reports]);

  function recenter() {
    if (!mapRef.current) return;
    const center: [number, number] =
      userLat != null && userLng != null ? [userLat, userLng] : DEFAULT_CENTER;
    mapRef.current.setView(center, DEFAULT_ZOOM);
  }

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
        .dark-popup .leaflet-popup-content-wrapper { background:transparent; box-shadow:none; padding:0; }
        .dark-popup .leaflet-popup-content { margin:0; }
        .dark-popup .leaflet-popup-tip { background:#1e293b; }
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
      </div>
    </>
  );
}
