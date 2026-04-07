import type { ReactNode } from "react";
import { RegistruumTopNav } from "@/components/layout/registruum-top-nav";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type WorkspaceShellProps = Readonly<{
  profile: Profile;
  spaces: Space[];
  space?: Space | null;
  sidebar?: ReactNode;
  children: ReactNode;
}>;

export function WorkspaceShell({
  profile,
  spaces,
  space = null,
  sidebar = null,
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
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
