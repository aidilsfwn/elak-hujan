import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { copy } from '@/constants/copy';

interface GearCheckPanelProps {
  probability: number;
  rainThreshold: number;
}

export function GearCheckPanel({ probability, rainThreshold }: GearCheckPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const tips =
    probability >= 70
      ? copy.leaveAdvisor.gearCheck.tips.high
      : probability >= rainThreshold
      ? copy.leaveAdvisor.gearCheck.tips.medium
      : copy.leaveAdvisor.gearCheck.tips.low;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span>{copy.leaveAdvisor.gearCheck.title} 🎽</span>
        {expanded
          ? <ChevronUp className="size-4 text-muted-foreground" />
          : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 pb-3 pt-2 border-t space-y-1.5">
          {tips.map((tip, i) => (
            <p key={i} className="text-sm text-muted-foreground">{tip}</p>
          ))}
        </div>
      )}
    </div>
  );
}
