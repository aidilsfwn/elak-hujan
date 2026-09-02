import type { ScoredDay } from '@/lib/rainScoring';

const dayNames: Record<string, string> = { monday: 'Isnin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Khamis', friday: 'Jumaat' };

export interface SmartBriefingInput {
  days: ScoredDay[];
  target: number;
  completed: number;
  isCurrentWeek: boolean;
}

export interface SmartBriefingCopy {
  headline: string;
  summary: string;
}

function commuteComparison(day: ScoredDay): string | null {
  if (day.morningScore === null || day.eveningScore === null) return null;
  const morning = Math.round(day.morningScore);
  const evening = Math.round(day.eveningScore);
  if (Math.abs(morning - evening) <= 5) return `Peluang hujan pagi dan petang hampir sama, sekitar ${morning}% dan ${evening}%.`;
  return morning < evening
    ? `Perjalanan pagi kelihatan lebih baik, dengan ${morning}% berbanding ${evening}% pada petang.`
    : `Perjalanan petang kelihatan lebih baik, dengan ${evening}% berbanding ${morning}% pada pagi.`;
}

function confidenceNote(day: ScoredDay): string {
  if (day.hasThunderstorm) return 'Terdapat potensi ribut petir, jadi semak ramalan semula sebelum bergerak.';
  if (day.confidence === 'rendah') return 'Ini masih pandangan awal dan boleh berubah apabila hari semakin hampir.';
  if (day.confidence === 'sederhana') return 'Semak semula apabila hari semakin hampir kerana keyakinan ramalan masih sederhana.';
  return 'Keyakinan ramalan untuk pilihan ini tinggi.';
}

export function buildSmartBriefing({ days, target, completed, isCurrentWeek }: SmartBriefingInput): SmartBriefingCopy {
  const available = days.filter((day) => day.combinedScore !== null && !day.isUnavailable).sort((a, b) => a.combinedScore! - b.combinedScore!);
  const recommended = available.filter((day) => day.isRecommended);
  const best = recommended[0] ?? available[0];
  const remaining = Math.max(0, target - completed);

  if (!best) return days.some((day) => day.combinedScore !== null) ? {
    headline: 'Tiada hari tersedia untuk dicadangkan.',
    summary: 'Semua hari yang tinggal telah ditandakan sebagai hari anda tidak boleh ke pejabat.',
  } : {
    headline: 'Belum cukup data untuk diringkaskan.',
    summary: 'Ramalan lengkap bagi laluan pagi dan petang belum tersedia untuk minggu ini.',
  };

  let headline: string;
  let opening: string;
  if (isCurrentWeek && remaining === 0) {
    headline = 'Sasaran minggu ini sudah selesai.';
    opening = `Tiada hari tambahan diperlukan. Jika anda perlu hadir lagi, ${dayNames[best.dayName]} mempunyai risiko terendah antara hari yang tinggal.`;
  } else if (isCurrentWeek) {
    headline = `${remaining} hari lagi untuk melengkapkan sasaran.`;
    opening = recommended.length === 0
      ? 'Tiada hari tambahan yang dapat disyorkan dengan data lengkap buat masa ini.'
      : recommended.length < remaining
        ? `Hanya ${recommended.length} hari tersedia; ${dayNames[best.dayName]} ialah pilihan utama.`
        : `${dayNames[best.dayName]} ialah pilihan utama daripada ${recommended.length} hari yang disyorkan.`;
  } else {
    headline = `${recommended.length} hari disyorkan untuk minggu depan.`;
    opening = recommended.length > 0
      ? `${dayNames[best.dayName]} ialah pilihan utama berdasarkan risiko perjalanan keseluruhan.`
      : 'Tiada hari yang dapat disyorkan dengan data lengkap buat masa ini.';
  }

  return {
    headline,
    summary: [opening, commuteComparison(best), confidenceNote(best)].filter(Boolean).join(' '),
  };
}
