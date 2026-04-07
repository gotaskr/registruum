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
  const requestedSection = getSectionFromSearchParam(searchParams.get("section"));
  const activeSection =
    requestedSection === "security" && !canManagePassword
      ? "profile"
      : requestedSection;

  const activeSectionMeta = useMemo(
    () =>
      settingsSections.find((section) => section.id === activeSection) ??
      getVisibleSettingsSections(canManagePassword)[0],
    [activeSection, canManagePassword],
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
    <section className="px-6 py-6 lg:px-8">
      <div className="mb-5 rounded-[1.75rem] border border-border bg-panel px-6 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          {activeSectionMeta?.label ?? "Profile"}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          Configure how your Registruum identity and account surfaces behave.
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
