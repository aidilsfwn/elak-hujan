import { LocationField } from '@/components/LocationField';
import type { UserConfig } from '@/types/config';
export function StepLocation({ draft, onUpdate }: { draft: Partial<UserConfig>; onUpdate: (value: Partial<UserConfig>) => void }) { return <div className="setup-locations"><LocationField label="Rumah" placeholder="Cari lokasi rumah…" value={draft.homeLocation} onChange={(homeLocation) => onUpdate({ homeLocation })} /><LocationField label="Pejabat" placeholder="Cari lokasi pejabat…" value={draft.officeLocation} onChange={(officeLocation) => onUpdate({ officeLocation })} /></div>; }
