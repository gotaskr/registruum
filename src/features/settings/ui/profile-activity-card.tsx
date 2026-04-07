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
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Last active
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">
            {formatDateTimeLabel(profile.updatedAt)}
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Account created
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">
            {formatDateLabel(profile.createdAt)}
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
