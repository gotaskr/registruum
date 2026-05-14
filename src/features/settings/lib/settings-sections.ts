import {
  Bell,
  CreditCard,
  Database,
  Globe,
  Inbox,
  Lock,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isBillingDisabled } from "@/features/settings/lib/billing-feature-flag";

/** Billing nav/profile entry; off when `NEXT_PUBLIC_BILLING_DISABLED=true` (pre-launch). */
export const SETTINGS_BILLING_SECTION_ENABLED = !isBillingDisabled();

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
