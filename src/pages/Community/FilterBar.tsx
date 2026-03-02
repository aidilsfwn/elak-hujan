import { copy } from '@/constants/copy';
import { MALAYSIAN_STATES } from '@/constants/malaysia';
import { cn } from '@/lib/utils';
import type { ReportFilters } from '@/types/community';

interface FilterBarProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
}

const JENIS_OPTIONS = [
  { value: 'semua',  label: copy.community.filterAll },
  { value: 'hujan',  label: copy.community.filterHujan },
  { value: 'bahaya', label: copy.community.filterBahaya },
] as const;

const MASA_OPTIONS = [
  { value: 30,  label: copy.community.filter30min },
  { value: 60,  label: copy.community.filter1h },
  { value: 120, label: copy.community.filter2h },
] as const;

const chip = (active: boolean) =>
  cn(
    'px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0',
    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
  );

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const stateValue = filters.lokasi === 'berhampiran' ? '' : filters.lokasi;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 border-b bg-background">
      {/* Jenis */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-12 shrink-0">{copy.community.filterJenis}</span>
        <div className="flex gap-1.5">
          {JENIS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, jenis: value })}
              className={chip(filters.jenis === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Masa */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-12 shrink-0">{copy.community.filterMasa}</span>
        <div className="flex gap-1.5">
          {MASA_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, masa: value })}
              className={chip(filters.masa === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lokasi */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-12 shrink-0">{copy.community.filterLokasi}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange({ ...filters, lokasi: 'berhampiran' })}
            className={chip(filters.lokasi === 'berhampiran')}
          >
            {copy.community.filterNearMe}
          </button>
          <select
            value={stateValue}
            onChange={(e) => {
              if (e.target.value) onChange({ ...filters, lokasi: e.target.value });
            }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors border-0 outline-none cursor-pointer',
              stateValue
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <option value="">Negeri ▾</option>
            {MALAYSIAN_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
