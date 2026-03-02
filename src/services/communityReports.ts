import { supabase } from './supabase';
import type { CommunityReport, ReportCategory, ReportFilters, ReportSubType } from '@/types/community';

export interface SubmitReportPayload {
  lat: number;
  lng: number;
  state: string;
  category: ReportCategory;
  sub_type: ReportSubType;
  deviceHash: string;
}

export async function fetchReports(
  filters: ReportFilters,
  userLat?: number,
  userLng?: number,
): Promise<CommunityReport[]> {
  const cutoff = new Date(Date.now() - filters.masa * 60 * 1000).toISOString();

  let query = supabase
    .from('community_reports_public')
    .select('*')
    .gte('reported_at', cutoff)
    .order('reported_at', { ascending: false });

  if (filters.jenis !== 'semua') {
    query = query.eq('category', filters.jenis);
  }

  if (filters.lokasi !== 'berhampiran') {
    query = query.eq('state', filters.lokasi);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let reports = (data ?? []) as CommunityReport[];

  // Client-side distance filter for 'berhampiran' (25km radius)
  if (filters.lokasi === 'berhampiran' && userLat != null && userLng != null) {
    reports = reports.filter((r) => haversineKm(userLat, userLng, r.lat, r.lng) <= 25);
  }

  return reports;
}

export async function submitReport(payload: SubmitReportPayload): Promise<string> {
  const expiresHours = payload.category === 'bahaya' ? 6 : 2;

  const { data, error } = await supabase.rpc('create_community_report', {
    p_lat: payload.lat,
    p_lng: payload.lng,
    p_state: payload.state,
    p_category: payload.category,
    p_sub_type: payload.sub_type,
    p_device_hash: payload.deviceHash,
    p_expires_hours: expiresHours,
  });

  if (error) {
    if (error.message.includes('rate_limited')) throw new Error('rate_limited');
    throw new Error(error.message);
  }

  return data as string;
}

export async function confirmReport(reportId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_community_report', {
    p_report_id: reportId,
  });
  if (error) throw new Error(error.message);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
