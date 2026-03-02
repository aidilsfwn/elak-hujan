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

const HUJAN_SUBTYPES: { value: HujanSubType; label: string }[] = [
  { value: 'renyai', label: copy.community.subTypeRenyai },
  { value: 'sederhana', label: copy.community.subTypeSederhana },
  { value: 'lebat', label: copy.community.subTypeLebat },
];

const BAHAYA_SUBTYPES: { value: BahayaSubType; label: string }[] = [
  { value: 'banjir_kilat', label: copy.community.subTypeBanjirKilat },
  { value: 'jalan_banjir', label: copy.community.subTypeJalanBanjir },
  { value: 'pokok_tumbang', label: copy.community.subTypePokokTumbang },
  { value: 'lain', label: copy.community.subTypeLain },
];

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
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
  const [toast, setToast] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('category');
      setCategory(null);
      setSubType(null);
      setLat(null);
      setLng(null);
      setState(null);
      setToast(null);
    }
  }, [open]);

  // Auto-detect location when reaching confirm step
  useEffect(() => {
    if (step !== 'confirm') return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        const detectedState = await reverseGeocode(latitude, longitude);
        setState(detectedState ?? config?.homeLocation.state ?? null);
        setLocating(false);
      },
      () => {
        // Fallback to home location
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

    submit(
      { lat, lng, state, category, sub_type: subType, deviceHash },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
        onError: (err) => {
          const msg = err.message === 'rate_limited'
            ? copy.community.submitRateLimited
            : copy.community.submitError;
          setToast(msg);
        },
      },
    );
  }

  const subtypes = category === 'hujan' ? HUJAN_SUBTYPES : BAHAYA_SUBTYPES;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle>{copy.community.reportSheetTitle}</SheetTitle>
        </SheetHeader>

        {/* Step: category */}
        {step === 'category' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{copy.community.stepCategory}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCategorySelect('hujan')}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 text-blue-700 dark:text-blue-400 font-medium"
              >
                <CloudRain className="size-7" />
                {copy.community.categoryHujan}
              </button>
              <button
                onClick={() => handleCategorySelect('bahaya')}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900 text-orange-700 dark:text-orange-400 font-medium"
              >
                <TriangleAlert className="size-7" />
                {copy.community.categoryBahaya}
              </button>
            </div>
          </div>
        )}

        {/* Step: subtype */}
        {step === 'subtype' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('category')} className="text-muted-foreground">
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-sm text-muted-foreground">{copy.community.stepSubType}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {subtypes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleSubTypeSelect(value)}
                  className="p-4 rounded-xl border text-sm font-medium text-left hover:bg-muted transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: confirm + submit */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('subtype')} className="text-muted-foreground">
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-sm text-muted-foreground">{copy.community.stepLocation}</p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/40">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              {locating ? (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin" />
                  {copy.community.detectingLocation}
                </span>
              ) : (
                <span className="text-sm">{state ?? '—'}</span>
              )}
            </div>

            {toast && (
              <p className={cn('text-xs', toast === copy.community.submitRateLimited ? 'text-amber-600' : 'text-destructive')}>
                {toast}
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || locating || !lat || !state}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {copy.community.submitting}
                </span>
              ) : (
                copy.community.submitButton
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
