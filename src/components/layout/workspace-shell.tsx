import type { ReactNode } from "react";
import { RegistruumTopNav } from "@/components/layout/registruum-top-nav";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type WorkspaceShellProps = Readonly<{
  profile: Profile;
  spaces: Space[];
  space?: Space | null;
  sidebar?: ReactNode;
  /** Shown only below `lg`; desktop layout is unchanged. */
  mobileBottomNav?: ReactNode;
  children: ReactNode;
}>;

export function WorkspaceShell({
  profile,
  spaces,
  space = null,
  sidebar = null,
  mobileBottomNav = null,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <RegistruumTopNav profile={profile} spaces={spaces} space={space} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {sidebar ? (
          <aside className="hidden w-[18.5rem] shrink-0 overflow-hidden border-r border-[#dbe4f0] bg-[#f7faff] lg:block">
            <div className="h-full min-h-0 min-w-0 overflow-y-auto p-4">{sidebar}</div>
          </aside>
        ) : null}
        {mobileBottomNav ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
            <div className="z-10 flex shrink-0 justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-1 sm:px-4 lg:hidden">
              <div className="w-full min-w-0 max-w-md rounded-[1.35rem] border border-slate-200/90 bg-white/95 text-slate-900 shadow-[0_14px_44px_rgba(15,23,42,0.11),0_6px_20px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/[0.05] backdrop-blur-xl backdrop-saturate-150 dark:border-slate-500/35 dark:bg-[#1e293b]/97 dark:text-white dark:shadow-[0_20px_56px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.38)] dark:ring-white/[0.07] supports-[backdrop-filter]:bg-white/92 supports-[backdrop-filter]:dark:bg-[#1e293b]/94">
                {mobileBottomNav}
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
        )}
      </div>
    </div>
  );
}
