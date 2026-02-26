import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { copy } from '@/constants/copy';
import type { UserConfig } from '@/types/config';

interface StepCommuteProps {
  draft: Partial<UserConfig>;
  onUpdate: (partial: Partial<UserConfig>) => void;
}

interface TimeRangeProps {
  label: string;
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}

function TimeRange({ label, start, end, onStartChange, onEndChange }: TimeRangeProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 min-w-0">
          <Label className="text-xs text-muted-foreground">
            {copy.onboarding.commute.startLabel}
          </Label>
          <Input
            type="time"
            value={start}
            onChange={(e) => onStartChange(e.target.value)}
            className="text-base appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
        <div className="space-y-1 min-w-0">
          <Label className="text-xs text-muted-foreground">
            {copy.onboarding.commute.endLabel}
          </Label>
          <Input
            type="time"
            value={end}
            onChange={(e) => onEndChange(e.target.value)}
            className="text-base appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
}

export function StepCommute({ draft, onUpdate }: StepCommuteProps) {
  const morning = draft.morningWindow ?? { start: '08:00', end: '09:00' };
  const evening = draft.eveningWindow ?? { start: '17:00', end: '18:00' };

  return (
    <div className="space-y-8">
      <TimeRange
        label={copy.onboarding.commute.morningLabel}
        start={morning.start}
        end={morning.end}
        onStartChange={(v) => onUpdate({ morningWindow: { ...morning, start: v } })}
        onEndChange={(v) => onUpdate({ morningWindow: { ...morning, end: v } })}
      />
      <TimeRange
        label={copy.onboarding.commute.eveningLabel}
        start={evening.start}
        end={evening.end}
        onStartChange={(v) => onUpdate({ eveningWindow: { ...evening, start: v } })}
        onEndChange={(v) => onUpdate({ eveningWindow: { ...evening, end: v } })}
      />
    </div>
  );
}
