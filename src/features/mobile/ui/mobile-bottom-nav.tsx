"use client";

import { Archive, Building2, Home, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getMobileAccountHref,
  getMobileArchiveHref,
  getMobileHomeHref,
  getMobileSpacesHref,
  type MobilePrimaryTab,
} from "@/features/mobile/lib/routes";
import { cn } from "@/lib/utils";

const items: ReadonlyArray<{
  tab: MobilePrimaryTab;
  label: string;
  href: string;
  icon: typeof Home;
  matches: (pathname: string) => boolean;
}> = [
  {
    tab: "home",
    label: "Home",
    href: getMobileHomeHref(),
    icon: Home,
    matches: (pathname) => pathname === getMobileHomeHref(),
  },
  {
    tab: "spaces",
    label: "Spaces",
    href: getMobileSpacesHref(),
    icon: Building2,
    matches: (pathname) =>
      pathname === getMobileSpacesHref() || pathname.startsWith("/m/space/"),
  },
  {
    tab: "archive",
    label: "Archive",
    href: getMobileArchiveHref(),
    icon: Archive,
    matches: (pathname) => pathname.startsWith("/m/archive"),
  },
  {
    tab: "account",
    label: "Account",
    href: getMobileAccountHref(),
    icon: UserRound,
    matches: (pathname) => pathname.startsWith("/m/account"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-slate-200/80 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.8rem)] pt-3 backdrop-blur-md shadow-[0_-12px_32px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-2">
        {items.map(({ label, href, icon: Icon, matches }) => {
          const isActive = matches(pathname);

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex min-h-[3.6rem] flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2.5 text-[11px] font-semibold transition-all active:scale-[0.98]",
                isActive
                  ? "bg-[#e8efff] text-[#3566d6] shadow-[0_8px_18px_rgba(53,102,214,0.14)]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
