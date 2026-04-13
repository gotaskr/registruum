"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BOTTOM_NAV_ICON_BOX,
  BottomNavLabel,
  bottomNavItemClasses,
} from "@/components/layout/bottom-nav-shared";
import { BottomNavScrollArea } from "@/components/layout/bottom-nav-scroll-area";
import {
  getVisibleSettingsSections,
  settingsSections,
  type SettingsSectionId,
} from "@/features/settings/lib/settings-sections";

function getActiveSection(value: string | null): SettingsSectionId {
  const normalized = value as SettingsSectionId | null;

  if (normalized && settingsSections.some((section) => section.id === normalized)) {
    return normalized;
  }

  return "profile";
}

type SettingsBottomNavProps = Readonly<{
  canManagePassword: boolean;
}>;

export function SettingsBottomNav({
  canManagePassword,
}: SettingsBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const visibleSections = getVisibleSettingsSections(canManagePassword);
  const activeSection = getActiveSection(searchParams.get("section"));
  const resolvedActiveSection = visibleSections.some(
    (section) => section.id === activeSection,
  )
    ? activeSection
    : "profile";

  useLayoutEffect(() => {
    activeLinkRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [resolvedActiveSection, pathname]);

  return (
    <nav
      aria-label="Settings"
      className="flex w-full min-w-0 items-stretch"
    >
      <div className="flex shrink-0 flex-col justify-center border-r border-slate-200 py-2 pl-2 pr-1 dark:border-white/15 sm:pl-2.5">
        <Link
          href="/"
          className={bottomNavItemClasses(false)}
          title="Back to dashboard"
        >
          <span className={BOTTOM_NAV_ICON_BOX}>
            <ArrowLeft
              className="h-[1.15rem] w-[1.15rem] stroke-[2.5] text-current"
              aria-hidden
            />
          </span>
          <BottomNavLabel>Back</BottomNavLabel>
        </Link>
      </div>
      <BottomNavScrollArea
        landmark="none"
        aria-label="Settings sections"
        className="min-w-0 flex-1"
        innerClassName="min-h-[4rem] gap-0.5 py-2 pr-2 pl-1 sm:gap-1 sm:pr-3"
      >
      {visibleSections.map((section) => {
        const Icon = section.icon;
        const isActive = resolvedActiveSection === section.id;

        return (
          <Link
            key={section.id}
            ref={isActive ? activeLinkRef : undefined}
            href={`${pathname}?section=${section.id}`}
            scroll={false}
            className={bottomNavItemClasses(isActive, { equalWidth: false })}
            title={section.label}
          >
            <span className={BOTTOM_NAV_ICON_BOX}>
              <Icon
                className="h-[1.15rem] w-[1.15rem] stroke-[2.35] text-current"
                aria-hidden
              />
            </span>
            <BottomNavLabel>{section.label}</BottomNavLabel>
          </Link>
        );
      })}
      </BottomNavScrollArea>
    </nav>
  );
}
