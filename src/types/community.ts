export type ReportCategory = 'hujan' | 'bahaya';
export type HujanSubType = 'renyai' | 'sederhana' | 'lebat';
export type BahayaSubType = 'banjir_kilat' | 'jalan_banjir' | 'pokok_tumbang' | 'lain';
export type ReportSubType = HujanSubType | BahayaSubType;

export interface CommunityReport {
  id: string;
  lat: number;
  lng: number;
  state: string;
  category: ReportCategory;
  sub_type: ReportSubType;
  reported_at: string;
  expires_at: string;
  confirms: number;
}

export interface ReportFilters {
  jenis: 'semua' | ReportCategory;
  masa: 30 | 60 | 120;
  lokasi: 'berhampiran' | string; // string = state name
}
