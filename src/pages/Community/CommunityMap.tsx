import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useReports } from '@/hooks/useReports';
import type { CommunityReport, ReportFilters } from '@/types/community';

interface CommunityMapProps {
  filters: ReportFilters;
  userLat?: number;
  userLng?: number;
}

const DEFAULT_CENTER: [number, number] = [3.147, 101.6958]; // KL
const DEFAULT_ZOOM = 11;

function makeMarker(report: CommunityReport): L.Marker {
  const isHujan = report.category === 'hujan';
  const color = isHujan ? '#3b82f6' : '#f97316';
  const size = report.sub_type === 'lebat' ? 14 : report.sub_type === 'sederhana' ? 11 : 9;

  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid white;
      border-radius:${isHujan ? '50%' : '3px'};
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      transform:${isHujan ? 'none' : 'rotate(45deg)'};
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  const minutesAgo = Math.max(
    1,
    Math.floor((Date.now() - new Date(report.reported_at).getTime()) / 60000),
  );
  const timeLabel = minutesAgo < 60 ? `${minutesAgo} min lalu` : `${Math.floor(minutesAgo / 60)} jam lalu`;

  return L.marker([report.lat, report.lng], { icon }).bindPopup(
    `<div style="font-size:13px;line-height:1.5">
      <strong>${report.sub_type.replace(/_/g, ' ')}</strong><br/>
      ${report.state}<br/>
      <span style="color:#888">${timeLabel}</span>
      ${report.confirms > 0 ? `<br/><span style="color:#888">${report.confirms} sahkan</span>` : ''}
    </div>`,
    { maxWidth: 160 },
  );
}

export function CommunityMap({ filters, userLat, userLng }: CommunityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const { data: reports } = useReports(filters, userLat, userLng);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      userLat != null && userLng != null ? [userLat, userLng] : DEFAULT_CENTER;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(center, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when reports change
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();
    reports?.forEach((report) => makeMarker(report).addTo(markersRef.current!));
  }, [reports]);

  return (
    <div
      ref={containerRef}
      style={{ height: 'calc(100dvh - 8rem)', width: '100%' }}
    />
  );
}
