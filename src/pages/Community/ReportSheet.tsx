import { useState, useEffect } from 'react';
import { CloudRain, TriangleAlert, MapPin, Loader2, ChevronLeft } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { copy } from '@/constants/copy';
import { MALAYSIAN_STATES } from '@/constants/malaysia';
import { useConfig } from '@/hooks/useConfig';
import { useDeviceHash } from '@/hooks/useDeviceHash';
import { useSubmitReport } from '@/hooks/useSubmitReport';
import { cn } from '@/lib/utils';
import type { ReportCategory, HujanSubType, BahayaSubType } from '@/types/community';

interface ReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'category' | 'subtype' | 'confirm';

const STEPS: Step[] = ['category', 'subtype', 'confirm'];

const HUJAN_SUBTYPES: { value: HujanSubType; emoji: string; label: string }[] = [
  { value: 'renyai',    emoji: '🌦️', label: copy.community.subTypeRenyai },
  { value: 'sederhana', emoji: '🌧️', label: copy.community.subTypeSederhana },
  { value: 'lebat',     emoji: '⛈️', label: copy.community.subTypeLebat },
];

const BAHAYA_SUBTYPES: { value: BahayaSubType; emoji: string; label: string }[] = [
  { value: 'banjir_kilat',  emoji: '🌊', label: copy.community.subTypeBanjirKilat },
  { value: 'jalan_banjir',  emoji: '🚧', label: copy.community.subTypeJalanBanjir },
  { value: 'pokok_tumbang', emoji: '🌳', label: copy.community.subTypePokokTumbang },
  { value: 'lain',          emoji: '⚠️', label: copy.community.subTypeLain },
];

const SUBTYPE_EMOJI: Record<string, string> = {
  renyai: '🌦️', sederhana: '🌧️', lebat: '⛈️',
  banjir_kilat: '🌊', jalan_banjir: '🚧', pokok_tumbang: '🌳', lain: '⚠️',
};

const SUBTYPE_LABEL: Record<string, string> = {
  renyai: copy.community.subTypeRenyai,
  sederhana: copy.community.subTypeSederhana,
  lebat: copy.community.subTypeLebat,
  banjir_kilat: copy.community.subTypeBanjirKilat,
  jalan_banjir: copy.community.subTypeJalanBanjir,
  pokok_tumbang: copy.community.subTypePokokTumbang,
  lain: copy.community.subTypeLain,
};

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(), lon: lng.toString(),
      format: 'json', addressdetails: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'User-Agent': 'ElakHujan/1.0 (rain planner for Malaysian riders)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawState: string | undefined = data?.address?.state;
    if (!rawState) return null;
    return (MALAYSIAN_STATES as readonly string[]).find((s) =>
      rawState.toLowerCase().includes(s.toLowerCase()),
    ) ?? null;
  } catch {
    return null;
  }
}

export function ReportSheet({ open, onOpenChange, onSuccess }: ReportSheetProps) {
  const { config } = useConfig();
  const deviceHash = useDeviceHash();
  const { mutate: submit, isPending } = useSubmitReport();

  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [subType, setSubType] = useState<HujanSubType | BahayaSubType | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('category');
      setCategory(null);
      setSubType(null);
      setLat(null);
      setLng(null);
      setState(null);
      setErrorMsg(null);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 'confirm') return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        const detected = await reverseGeocode(latitude, longitude);
        setState(detected ?? config?.homeLocation.state ?? null);
        setLocating(false);
      },
      () => {
        if (config) {
          setLat(config.homeLocation.lat);
          setLng(config.homeLocation.lon);
          setState(config.homeLocation.state);
        }
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }, [step, config]);

  function handleCategorySelect(cat: ReportCategory) {
    setCategory(cat);
    setSubType(null);
    setStep('subtype');
  }

  function handleSubTypeSelect(st: HujanSubType | BahayaSubType) {
    setSubType(st);
    setStep('confirm');
  }

  function handleSubmit() {
    if (!lat || !lng || !state || !category || !subType || !deviceHash) return;
    setErrorMsg(null);
    submit(
      { lat, lng, state, category, sub_type: subType, deviceHash },
      {
        onSuccess: () => { onOpenChange(false); onSuccess(); },
        onError: (err) => {
          setErrorMsg(
            err.message === 'rate_limited'
              ? copy.community.submitRateLimited
              : copy.community.submitError,
          );
        },
      },
    );
  }

  const stepIdx = STEPS.indexOf(step);
  const subtypes = category === 'hujan' ? HUJAN_SUBTYPES : BAHAYA_SUBTYPES;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-10 pt-4">

        {/* Step progress bar */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                i <= stepIdx ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>

        {/* Title row */}
        <SheetHeader className="mb-5 text-left">
          <div className="flex items-center gap-3">
            {step !== 'category' && (
              <button
                onClick={() => setStep(step === 'confirm' ? 'subtype' : 'category')}
                className="flex items-center justify-center size-8 rounded-full bg-muted text-muted-foreground shrink-0"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            <SheetTitle className="text-base">
              {step === 'category' && copy.community.stepCategory}
              {step === 'subtype' && copy.community.stepSubType}
              {step === 'confirm' && 'Sahkan laporan'}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Step 1 — category */}
        {step === 'category' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCategorySelect('hujan')}
              className="flex flex-col items-center gap-3 py-7 rounded-2xl border-2 border-blue-100 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400 font-semibold active:scale-[0.97] transition-transform"
            >
              <CloudRain className="size-8" />
              <span className="text-sm">{copy.community.categoryHujan}</span>
            </button>
            <button
              onClick={() => handleCategorySelect('bahaya')}
              className="flex flex-col items-center gap-3 py-7 rounded-2xl border-2 border-orange-100 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:border-orange-900 dark:text-orange-400 font-semibold active:scale-[0.97] transition-transform"
            >
              <TriangleAlert className="size-8" />
              <span className="text-sm">{copy.community.categoryBahaya}</span>
            </button>
          </div>
        )}

        {/* Step 2 — subtype */}
        {step === 'subtype' && (
          <div className="grid grid-cols-2 gap-2">
            {subtypes.map(({ value, emoji, label }) => (
              <button
                key={value}
                onClick={() => handleSubTypeSelect(value)}
                className="flex items-center gap-3 p-4 rounded-xl border bg-muted/30 text-sm font-medium text-left active:scale-[0.97] transition-transform"
              >
                <span className="text-xl leading-none">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step 3 — confirm */}
        {step === 'confirm' && (
          <div className="space-y-2">
            {/* Selection summary */}
            {category && subType && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <span className="text-2xl leading-none">{SUBTYPE_EMOJI[subType]}</span>
                <div>
                  <p className="text-sm font-semibold">
                    {category === 'hujan' ? copy.community.categoryHujan : copy.community.categoryBahaya}
                    {' · '}
                    {SUBTYPE_LABEL[subType]}
                  </p>
                  <p className="text-xs text-muted-foreground">Laporan anda</p>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              {locating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{copy.community.detectingLocation}</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">{state ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Lokasi semasa</p>
                </div>
              )}
            </div>

            {/* Error */}
            {errorMsg && (
              <div className={cn(
                'p-4 rounded-xl text-sm',
                errorMsg === copy.community.submitRateLimited
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  : 'bg-destructive/10 text-destructive',
              )}>
                {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isPending || locating || !lat || !state}
              >
                {isPending
                  ? <><Loader2 className="size-4 animate-spin" />{copy.community.submitting}</>
                  : copy.community.submitButton}
              </Button>
            </div>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
}
