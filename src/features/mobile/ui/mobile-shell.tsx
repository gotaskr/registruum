import type { ReactNode } from "react";
import { MobileBottomNav } from "@/features/mobile/ui/mobile-bottom-nav";
import { cn } from "@/lib/utils";

type MobileShellProps = Readonly<{
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  showNav?: boolean;
}>;

export function MobileShell({
  children,
  header,
  className,
  showNav = true,
}: MobileShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f6f8fc_52%,#eef3f8_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[35rem] flex-col overflow-hidden bg-[#f7f9fc] shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        {header}
        <main className={cn("flex-1 overflow-y-auto", showNav ? "pb-28" : "pb-6", className)}>
          {children}
        </main>
        {showNav ? (
          <div className="sticky bottom-0 z-40 mt-auto w-full">
            <MobileBottomNav />
          </div>
        ) : null}
      </div>
    </div>
  );
}
