"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  getVisibleSettingsSections,
  settingsSections,
  type SettingsSectionId,
} from "@/features/settings/lib/settings-sections";
import type { ThemePreference } from "@/features/settings/lib/preferences";
import type { SessionDetails } from "@/features/settings/lib/session-details";
import { InvitationsSettingsSection } from "@/features/settings/ui/invitations-settings-section";
import { NotificationsSettingsSection } from "@/features/settings/ui/notifications-settings-section";
import { PreferencesSettingsSection } from "@/features/settings/ui/preferences-settings-section";
import { ProfileSettingsSection } from "@/features/settings/ui/profile-settings-section";
import { SecuritySettingsSection } from "@/features/settings/ui/security-settings-section";
import { SessionSettingsSection } from "@/features/settings/ui/session-settings-section";
import { SubscriptionSettingsSection } from "@/features/settings/ui/subscription-settings-section";
import type { SettingsInvitation } from "@/features/settings/types/invitation";
import type { Profile } from "@/types/profile";

type SettingsSectionViewProps = Readonly<{
  profile: Profile;
  session: SessionDetails;
  canManagePassword: boolean;
  currentTheme: ThemePreference;
  invitations: SettingsInvitation[];
}>;

function getSectionFromSearchParam(value: string | null): SettingsSectionId {
  const normalized = value as SettingsSectionId | null;

  if (normalized && settingsSections.some((section) => section.id === normalized)) {
    return normalized;
  }

  return "profile";
}

export function SettingsSectionView({
  profile,
  session,
  canManagePassword,
  currentTheme,
  invitations,
}: SettingsSectionViewProps) {
  const searchParams = useSearchParams();
  const visibleSections = getVisibleSettingsSections(canManagePassword);
  const requestedSection = getSectionFromSearchParam(searchParams.get("section"));
  const activeSection = visibleSections.some((section) => section.id === requestedSection)
    ? requestedSection
    : visibleSections[0]?.id ?? "profile";

  const activeSectionMeta = useMemo(
    () => visibleSections.find((section) => section.id === activeSection) ?? visibleSections[0],
    [activeSection, visibleSections],
  );

  const activeSectionContent =
    activeSection === "profile" ? (
      <ProfileSettingsSection profile={profile} />
    ) : activeSection === "invitations" ? (
      <InvitationsSettingsSection invitations={invitations} profile={profile} />
    ) : activeSection === "security" ? (
      <SecuritySettingsSection />
    ) : activeSection === "preferences" ? (
      <PreferencesSettingsSection profile={profile} currentTheme={currentTheme} />
    ) : activeSection === "notifications" ? (
      <NotificationsSettingsSection profile={profile} />
    ) : activeSection === "subscription" ? (
      <SubscriptionSettingsSection />
    ) : (
      <SessionSettingsSection session={session} />
    );

  return (
    <section className="px-5 py-5 lg:px-6">
      <div className="mb-4 border-b border-border pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          {activeSectionMeta?.label ?? "Profile"}
        </p>
      </div>

      <div
        key={activeSection}
        className="grid gap-4 animate-in fade-in-0 duration-200"
      >
        {activeSectionContent}
      </div>
    </section>
  );
}
