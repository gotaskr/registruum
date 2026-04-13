import { SettingsCard } from "@/features/settings/ui/settings-card";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/utils";
import type { Profile } from "@/types/profile";

type ProfileActivityCardProps = Readonly<{
  profile: Profile;
}>;

export function ProfileActivityCard({
  profile,
}: ProfileActivityCardProps) {
  return (
    <SettingsCard
      label="Activity"
      title="Account activity summary"
      description="A quick view of identity lifecycle timestamps."
    >
      <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.35rem] sm:px-4 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
            Last active
          </p>
          <p className="mt-2 text-sm font-medium leading-snug text-foreground sm:mt-3">
            {formatDateTimeLabel(profile.updatedAt)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-panel-muted px-3 py-3 sm:rounded-[1.35rem] sm:px-4 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px] sm:tracking-[0.22em]">
            Account created
          </p>
          <p className="mt-2 text-sm font-medium leading-snug text-foreground sm:mt-3">
            {formatDateLabel(profile.createdAt)}
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
