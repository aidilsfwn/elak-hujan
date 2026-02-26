import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CalendarCheck, Droplets, AlertTriangle, Check, Info, Github, Linkedin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { LocationField } from '@/components/LocationField';
import { RAIN_THRESHOLD_MIN, RAIN_THRESHOLD_MAX } from '@/constants/thresholds';
import { copy } from '@/constants/copy';
import { useConfig } from '@/hooks/useConfig';
import { clearConfig } from '@/lib/localStorage';
import type { UserConfig } from '@/types/config';
import { cn } from '@/lib/utils';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;
const DAY_LABELS: Record<string, string> = {
  monday: 'Isn', tuesday: 'Sel', wednesday: 'Rab', thursday: 'Kha', friday: 'Jum',
};

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary shrink-0" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function Settings() {
  const { config, setConfig } = useConfig();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<UserConfig>(() => config!);

  if (!config) return null;

  function updateDraft(partial: Partial<UserConfig>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function toggleDay(day: string) {
    const next = draft.preferredDays.includes(day)
      ? draft.preferredDays.filter((d) => d !== day)
      : [...draft.preferredDays, day];
    updateDraft({ preferredDays: next });
  }

  function handleSave() {
    setConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (window.confirm(copy.settings.resetConfirm)) {
      clearConfig();
      navigate('/onboarding', { replace: true });
      window.location.reload();
    }
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold">{copy.settings.title}</h1>

      {/* Locations */}
      <SectionCard icon={MapPin} title={copy.settings.sectionLocation}>
        <LocationField
          label={copy.onboarding.location.homeLabel}
          placeholder={copy.onboarding.location.homePlaceholder}
          value={draft.homeLocation}
          onChange={(loc) => updateDraft({ homeLocation: loc })}
        />
        <LocationField
          label={copy.onboarding.location.officeLabel}
          placeholder={copy.onboarding.location.officePlaceholder}
          value={draft.officeLocation}
          onChange={(loc) => updateDraft({ officeLocation: loc })}
        />
      </SectionCard>

      {/* Commute windows */}
      <SectionCard icon={Clock} title={copy.settings.sectionCommute}>
        {([
          { label: copy.onboarding.commute.morningLabel, key: 'morningWindow' as const },
          { label: copy.onboarding.commute.eveningLabel, key: 'eveningWindow' as const },
        ]).map(({ label, key }) => (
          <div key={key} className="space-y-2">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 min-w-0">
                <Label className="text-[11px] text-muted-foreground/70">{copy.onboarding.commute.startLabel}</Label>
                <Input
                  type="time"
                  value={draft[key].start}
                  onChange={(e) => updateDraft({ [key]: { ...draft[key], start: e.target.value } })}
                  className="text-base appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <Label className="text-[11px] text-muted-foreground/70">{copy.onboarding.commute.endLabel}</Label>
                <Input
                  type="time"
                  value={draft[key].end}
                  onChange={(e) => updateDraft({ [key]: { ...draft[key], end: e.target.value } })}
                  className="text-base appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* Office days */}
      <SectionCard icon={CalendarCheck} title={copy.settings.sectionOfficeDays}>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{copy.onboarding.days.daysPerWeekLabel}</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateDraft({ officeDaysPerWeek: n })}
                className={cn(
                  'flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors',
                  draft.officeDaysPerWeek === n
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{copy.onboarding.days.preferredDaysLabel}</Label>
          <div className="flex gap-2">
            {ALL_DAYS.map((day) => {
              const isSelected = draft.preferredDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'flex-1 h-10 rounded-lg border text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-input hover:bg-accent',
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Rain threshold */}
      <SectionCard icon={Droplets} title={copy.settings.sectionRisk}>
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <p className="text-xs text-muted-foreground leading-tight max-w-[60%]">
              {copy.settings.rainThresholdHelper(draft.rainThreshold)}
            </p>
            <span className="text-3xl font-bold tabular-nums text-primary leading-none">
              {draft.rainThreshold}%
            </span>
          </div>
          <Slider
            min={RAIN_THRESHOLD_MIN}
            max={RAIN_THRESHOLD_MAX}
            step={5}
            value={[draft.rainThreshold]}
            onValueChange={([v]) => updateDraft({ rainThreshold: v })}
          />
        </div>
      </SectionCard>

      {/* Save */}
      <Button className="w-full h-11 text-base font-semibold" onClick={handleSave}>
        {saved ? (
          <span className="flex items-center gap-2">
            <Check className="size-4" />
            {copy.settings.saved}
          </span>
        ) : (
          copy.settings.saveButton
        )}
      </Button>

      {/* Danger zone */}
      <SectionCard
        icon={AlertTriangle}
        title={copy.settings.resetTitle}
        className="border-destructive/30 bg-destructive/5"
      >
        <p className="text-xs text-muted-foreground -mt-1">
          {copy.settings.resetConfirm}
        </p>
        <Button variant="destructive" className="w-full" onClick={handleReset}>
          {copy.settings.resetButton}
        </Button>
      </SectionCard>

      {/* About */}
      <SectionCard icon={Info} title={copy.about.sectionTitle}>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{copy.about.dataSourcesLabel}</p>
          <ul className="space-y-1">
            {copy.about.sources.map((s) => (
              <li key={s.name} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{s.name}</span>
                {' — '}
                {s.desc}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{copy.about.accuracyLabel}</p>
          <ul className="space-y-2">
            {copy.about.accuracyNotes.map((note, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
                <span className="text-muted-foreground/50 shrink-0">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground border-t pt-3">{copy.about.disclaimer}</p>
        <p className="text-xs text-muted-foreground/60 italic">{copy.about.tagline}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground/60 italic">{copy.about.credit}</p>
          <div className="flex gap-3">
            <a href={copy.about.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="size-4 text-muted-foreground/60 hover:text-foreground transition-colors" />
            </a>
            <a href={copy.about.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin className="size-4 text-muted-foreground/60 hover:text-foreground transition-colors" />
            </a>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
