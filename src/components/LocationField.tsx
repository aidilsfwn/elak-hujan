import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MALAYSIAN_STATES } from "@/constants/malaysia";
import { copy } from "@/constants/copy";
import { searchLocations, type NominatimResult } from "@/services/nominatim";
import type { Location } from "@/types/config";
import { cn } from "@/lib/utils";
import { normaliseName, guessState } from "@/lib/location-utils";

interface LocationFieldProps {
  label: string;
  placeholder: string;
  value: Location | undefined;
  onChange: (loc: Location) => void;
}

export function LocationField({
  label,
  placeholder,
  value,
  onChange,
}: LocationFieldProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Only search after the user has actually typed something
  const dirtyRef = useRef(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dirtyRef.current || query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchLocations(query);
        setResults(res);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(result: NominatimResult) {
    const name = normaliseName(result.display_name);
    const state = guessState(result);
    setQuery(name);
    setShowDropdown(false);
    setResults([]);
    onChange({
      name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      state,
    });
  }

  const hasValidLocation = !!(value?.lat && value?.lon);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Current location chip */}
      {hasValidLocation && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
          <MapPin className="size-3 shrink-0 text-primary" />
          <span className="truncate">{value!.name}</span>
          {value!.state && (
            <span className="shrink-0 text-muted-foreground/60">
              · {value!.state}
            </span>
          )}
        </div>
      )}

      {/* Search input + dropdown */}
      <div className="relative" ref={containerRef}>
        <Input
          value={query}
          onChange={(e) => {
            dirtyRef.current = true;
            setQuery(e.target.value);
            if (!e.target.value) {
              setShowDropdown(false);
              setResults([]);
            }
          }}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={hasValidLocation ? "Cari lokasi baru..." : placeholder}
          autoComplete="off"
        />
        {showDropdown && (
          <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
            {loading && (
              <p className="px-3 py-2.5 text-sm text-muted-foreground">
                {copy.onboarding.location.searching}
              </p>
            )}
            {!loading && results.length === 0 && (
              <p className="px-3 py-2.5 text-sm text-muted-foreground">
                {copy.onboarding.location.noResults}
              </p>
            )}
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                className={cn(
                  "w-full px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors",
                  "border-b border-border last:border-b-0",
                )}
                onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                onClick={() => handleSelect(r)}
              >
                <span className="font-medium">
                  {normaliseName(r.display_name)}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {r.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* State selector — always visible */}
      <Select
        value={value?.state ?? ""}
        onValueChange={(state) => {
          if (value) {
            onChange({ ...value, state });
          } else {
            // If no location, create a partial location with just state
            onChange({ name: "", lat: 0, lon: 0, state });
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={copy.onboarding.location.statePlaceholder}
          />
        </SelectTrigger>
        <SelectContent>
          {MALAYSIAN_STATES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
