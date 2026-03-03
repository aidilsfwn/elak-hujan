import { copy } from '@/constants/copy';

export const MARKER_CONFIG: Record<string, { emoji: string; bg: string }> = {
  renyai:        { emoji: '🌦️', bg: '#3b82f6' },
  sederhana:     { emoji: '🌧️', bg: '#3b82f6' },
  lebat:         { emoji: '⛈️', bg: '#ef4444' },
  banjir_kilat:  { emoji: '🌊', bg: '#ef4444' },
  jalan_banjir:  { emoji: '🚧', bg: '#f97316' },
  pokok_tumbang: { emoji: '🌳', bg: '#f97316' },
  lain:          { emoji: '⚠️', bg: '#94a3b8' },
  jalan_licin:   { emoji: '🟡', bg: '#eab308' },
  angin_kuat:    { emoji: '💨', bg: '#8b5cf6' },
};

export const SUBTYPE_LABEL: Record<string, string> = {
  renyai:        copy.community.subTypeRenyai,
  sederhana:     copy.community.subTypeSederhana,
  lebat:         copy.community.subTypeLebat,
  banjir_kilat:  copy.community.subTypeBanjirKilat,
  jalan_banjir:  copy.community.subTypeJalanBanjir,
  pokok_tumbang: copy.community.subTypePokokTumbang,
  lain:          copy.community.subTypeLain,
  jalan_licin:   copy.community.subTypeJalanLicin,
  angin_kuat:    copy.community.subTypeAnginKuat,
};
