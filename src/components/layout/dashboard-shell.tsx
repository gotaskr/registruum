import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { NewUserOnboardingModal } from "@/features/auth/ui/new-user-onboarding-modal";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type DashboardShellProps = Readonly<{
  spaces: Space[];
  profile: Profile;
  activeView?: "archive" | "jobMarket" | "settings";
  sidebar?: ReactNode;
  /** Shown only below `lg`; same floating dock as space routes when set. */
  mobileBottomNav?: ReactNode;
  children: ReactNode;
}>;

export function DashboardShell({
  spaces,
  profile,
  sidebar = null,
  mobileBottomNav = null,
  children,
}: DashboardShellProps) {
  return (
    <WorkspaceShell
      profile={profile}
      spaces={spaces}
      sidebar={sidebar}
      mobileBottomNav={mobileBottomNav}
    >
      <NewUserOnboardingModal profile={profile} />
      {children}
    </WorkspaceShell>
  );
}
