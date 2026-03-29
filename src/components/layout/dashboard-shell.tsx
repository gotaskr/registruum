import type { ReactNode } from "react";
import { GlobalRail } from "@/components/layout/global-rail";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type DashboardShellProps = Readonly<{
  spaces: Space[];
  profile: Profile;
  activeView?: "jobMarket" | "settings";
  sidebar: ReactNode;
  children: ReactNode;
}>;

export function DashboardShell({
  spaces,
  profile,
  activeView = "jobMarket",
  sidebar,
  children,
}: DashboardShellProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden bg-background text-foreground">
      <div className="grid h-full min-h-0 grid-cols-1 bg-panel lg:grid-cols-[4.75rem_21.5rem_minmax(0,1fr)]">
        <GlobalRail activeView={activeView} spaces={spaces} profile={profile} />
        <aside className="min-h-0 overflow-hidden border-b border-border bg-panel-muted lg:border-r lg:border-b-0">
          {sidebar}
        </aside>
        <div className="min-h-0 min-w-0 overflow-hidden border-t border-border bg-panel lg:border-t-0 lg:border-l">
          {children}
        </div>
      </div>
    </div>
  );
}
