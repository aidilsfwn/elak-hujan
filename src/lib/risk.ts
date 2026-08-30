export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export function getRiskLevel(probability: number, threshold = 40, severe = false): RiskLevel {
  if (severe) return 'severe';
  if (probability < threshold) return 'low';
  if (probability < 70) return 'moderate';
  return 'high';
}

export function getVerdict(probability: number, threshold = 40): string {
  if (probability < threshold) return 'Perjalanan nampak lancar';
  if (probability < 70) return 'Hujan mungkin mengganggu';
  return 'Lebih baik tunggu dahulu';
}

export const riskLabel: Record<RiskLevel, string> = {
  low: 'Risiko rendah',
  moderate: 'Risiko sederhana',
  high: 'Risiko tinggi',
  severe: 'Amaran aktif',
};
