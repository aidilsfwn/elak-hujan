import type { NominatimResult } from "@/services/nominatim";

export function normaliseName(displayName: string): string {
  return displayName.split(",").slice(0, 2).join(",").trim();
}

// Maps Nominatim's address.state variants → our display state names.
// Nominatim returns English names like "Federal Territory of Kuala Lumpur",
// "Penang", "Malacca" etc. that don't match our list directly.
const NOMINATIM_STATE_MAP: Record<string, string> = {
  johor: "Johor",
  kedah: "Kedah",
  kelantan: "Kelantan",
  melaka: "Melaka",
  malacca: "Melaka",
  "negeri sembilan": "Negeri Sembilan",
  pahang: "Pahang",
  perak: "Perak",
  perlis: "Perlis",
  "pulau pinang": "Pulau Pinang",
  penang: "Pulau Pinang",
  sabah: "Sabah",
  sarawak: "Sarawak",
  selangor: "Selangor",
  terengganu: "Terengganu",
  "kuala lumpur": "W.P. Kuala Lumpur",
  "federal territory of kuala lumpur": "W.P. Kuala Lumpur",
  "wilayah persekutuan kuala lumpur": "W.P. Kuala Lumpur",
  labuan: "W.P. Labuan",
  "federal territory of labuan": "W.P. Labuan",
  "wilayah persekutuan labuan": "W.P. Labuan",
  putrajaya: "W.P. Putrajaya",
  "federal territory of putrajaya": "W.P. Putrajaya",
  "wilayah persekutuan putrajaya": "W.P. Putrajaya",
};

export function guessState(result: NominatimResult): string {
  const raw = (result.address?.state ?? "").toLowerCase().trim();
  if (!raw) return "";

  // Exact map lookup first
  if (NOMINATIM_STATE_MAP[raw]) return NOMINATIM_STATE_MAP[raw];

  // Partial match within the map keys (handles truncated or variant strings)
  const key = Object.keys(NOMINATIM_STATE_MAP).find(
    (k) => raw.includes(k) || k.includes(raw),
  );
  return key ? NOMINATIM_STATE_MAP[key] : "";
}
