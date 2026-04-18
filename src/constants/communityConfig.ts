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
  renyai:        'Renyai',
  sederhana:     'Sederhana',
  lebat:         'Lebat',
  banjir_kilat:  'Banjir Kilat',
  jalan_banjir:  'Jalan Banjir',
  pokok_tumbang: 'Pokok Tumbang',
  lain:          'Lain-lain',
  jalan_licin:   'Jalan Licin',
  angin_kuat:    'Angin Kuat',
};
