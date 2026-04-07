import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type DashboardShellProps = Readonly<{
  spaces: Space[];
  profile: Profile;
  activeView?: "archive" | "jobMarket" | "settings";
  sidebar: ReactNode;
  children: ReactNode;
}>;

export function DashboardShell({
  spaces,
  profile,
  sidebar,
  children,
}: DashboardShellProps) {
  return (
    <WorkspaceShell profile={profile} spaces={spaces} sidebar={sidebar}>
      {children}
    </WorkspaceShell>
  );
}
