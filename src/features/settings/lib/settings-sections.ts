import {
  Bell,
  CreditCard,
  Database,
  Globe,
  Inbox,
  Lock,
  UserRound,
} from "lucide-react";

/** Toggle off to hide Billing in settings nav and deep links until the flow is ready. */
export const SETTINGS_BILLING_SECTION_ENABLED = false;
import type { LucideIcon } from "lucide-react";

export type SettingsSectionId =
  | "profile"
  | "invitations"
  | "security"
  | "preferences"
  | "notifications"
  | "subscription"
  | "session";

export const settingsSections: ReadonlyArray<{
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "invitations", label: "Invitations", icon: Inbox },
  { id: "security", label: "Security", icon: Lock },
  { id: "preferences", label: "Preference", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "subscription", label: "Billing", icon: CreditCard },
  { id: "session", label: "Sessions", icon: Database },
];

export function getVisibleSettingsSections(canManagePassword: boolean) {
  return settingsSections.filter((section) => {
    if (!SETTINGS_BILLING_SECTION_ENABLED && section.id === "subscription") {
      return false;
    }

    if (!canManagePassword && section.id === "security") {
      return false;
    }

    return true;
  });
}
