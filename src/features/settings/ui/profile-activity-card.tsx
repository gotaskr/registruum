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
      <div className="divide-y divide-border">
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="text-sm text-muted">Last active</span>
          <span className="text-sm font-medium text-foreground">
            {formatDateTimeLabel(profile.updatedAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <span className="text-sm text-muted">Account created</span>
          <span className="text-sm font-medium text-foreground">
            {formatDateLabel(profile.createdAt)}
          </span>
        </div>
      </div>
    </SettingsCard>
  );
}
