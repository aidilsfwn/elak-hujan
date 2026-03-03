import { copy } from '@/constants/copy';

interface RideabilityBadgeProps {
  probability: number;
}

function getLevel(score: number): { label: string; className: string } {
  if (score >= 80) return { label: copy.leaveAdvisor.rideabilityScores.selamat, className: 'text-emerald-100 bg-emerald-600/80' };
  if (score >= 60) return { label: copy.leaveAdvisor.rideabilityScores.baik, className: 'text-teal-100 bg-teal-600/80' };
  if (score >= 40) return { label: copy.leaveAdvisor.rideabilityScores.berhatiHati, className: 'text-amber-100 bg-amber-600/80' };
  if (score >= 20) return { label: copy.leaveAdvisor.rideabilityScores.berisiko, className: 'text-orange-100 bg-orange-600/80' };
  return { label: copy.leaveAdvisor.rideabilityScores.bahaya, className: 'text-red-100 bg-red-600/80' };
}

export function RideabilityBadge({ probability }: RideabilityBadgeProps) {
  const score = 100 - Math.round(probability);
  const { label, className } = getLevel(score);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-white/70">{copy.leaveAdvisor.rideabilityLabel}</span>
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}>
        {score} · {label}
      </span>
    </div>
  );
}
