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
  { id: "preferences", label: "Preferences", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "session", label: "Session", icon: Database },
];

export function getVisibleSettingsSections(canManagePassword: boolean) {
  return settingsSections.filter((section) => {
    if (section.id === "subscription") {
      return false;
    }

    if (!canManagePassword && section.id === "security") {
      return false;
    }

    return true;
  });
}
