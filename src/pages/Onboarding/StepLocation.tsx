import { LocationField } from "@/components/LocationField";
import { copy } from "@/constants/copy";
import type { UserConfig } from "@/types/config";

interface StepLocationProps {
  draft: Partial<UserConfig>;
  onUpdate: (partial: Partial<UserConfig>) => void;
}

export function StepLocation({ draft, onUpdate }: StepLocationProps) {
  return (
    <div className="space-y-6">
      <LocationField
        label={copy.onboarding.location.homeLabel}
        placeholder={copy.onboarding.location.homePlaceholder}
        value={draft.homeLocation}
        onChange={(loc) => onUpdate({ homeLocation: loc })}
      />
      <LocationField
        label={copy.onboarding.location.officeLabel}
        placeholder={copy.onboarding.location.officePlaceholder}
        value={draft.officeLocation}
        onChange={(loc) => onUpdate({ officeLocation: loc })}
      />
    </div>
  );
}
