"use client";

import { Archive, LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BOTTOM_NAV_ICON_BOX,
  BottomNavLabel,
  bottomNavItemClasses,
} from "@/components/layout/bottom-nav-shared";

export function ArchiveHubBottomNav() {
  const pathname = usePathname();
  const onArchiveHub = pathname === "/archive";

  return (
    <nav
      aria-label="Archive hub navigation"
      className="flex min-h-[4rem] items-center justify-center gap-0.5 px-2 py-2 sm:gap-1 sm:px-3"
    >
      <Link
        href="/"
        className={bottomNavItemClasses(false, { equalWidth: true })}
        title="Spaces"
      >
        <span className={BOTTOM_NAV_ICON_BOX}>
          <LayoutGrid className="h-[1.15rem] w-[1.15rem] stroke-[2.35] text-current" aria-hidden />
        </span>
        <BottomNavLabel>Spaces</BottomNavLabel>
      </Link>
      <Link
        href="/archive"
        className={bottomNavItemClasses(onArchiveHub, { equalWidth: true })}
        title="Archive"
      >
        <span className={BOTTOM_NAV_ICON_BOX}>
          <Archive className="h-[1.15rem] w-[1.15rem] stroke-[2.35] text-current" aria-hidden />
        </span>
        <BottomNavLabel>Archive</BottomNavLabel>
      </Link>
      <Link
        href="/settings"
        className={bottomNavItemClasses(pathname === "/settings", { equalWidth: true })}
        title="Settings"
      >
        <span className={BOTTOM_NAV_ICON_BOX}>
          <Settings className="h-[1.15rem] w-[1.15rem] stroke-[2.35] text-current" aria-hidden />
        </span>
        <BottomNavLabel>Settings</BottomNavLabel>
      </Link>
    </nav>
  );
}
