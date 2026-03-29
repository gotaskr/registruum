import { ProfileActivityCard } from "@/features/settings/ui/profile-activity-card";
import { ProfileCompanyCard } from "@/features/settings/ui/profile-company-card";
import { ProfileDisplayIdentityCard } from "@/features/settings/ui/profile-display-identity-card";
import { ProfileIdentityCard } from "@/features/settings/ui/profile-identity-card";
import type { Profile } from "@/types/profile";

type ProfileSettingsSectionProps = Readonly<{
  profile: Profile;
}>;

export function ProfileSettingsSection({
  profile,
}: ProfileSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <ProfileIdentityCard
        key={`identity-${profile.updatedAt}-${profile.avatarPath ?? "no-avatar"}`}
        profile={profile}
      />
      <ProfileCompanyCard
        key={`company-${profile.updatedAt}-${profile.representsCompany ? "on" : "off"}`}
        profile={profile}
      />
      <ProfileActivityCard profile={profile} />
      <ProfileDisplayIdentityCard
        key={`display-${profile.updatedAt}-${profile.displayName ?? profile.fullName}`}
        profile={profile}
      />
    </div>
  );
}
