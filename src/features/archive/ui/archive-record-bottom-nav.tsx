"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  BOTTOM_NAV_ICON_BOX,
  BottomNavLabel,
  bottomNavItemClasses,
} from "@/components/layout/bottom-nav-shared";
import { BottomNavScrollArea } from "@/components/layout/bottom-nav-scroll-area";
import {
  archiveRecordTabItems,
  parseArchiveRecordTab,
} from "@/features/archive/lib/archive-record-detail-tabs";
import { getArchiveRecordHref, getSpaceArchiveHref } from "@/lib/route-utils";

type ArchiveRecordBottomNavProps = Readonly<{
  archivedWorkOrderId: string;
  spaceId: string;
  folderId: string;
}>;

export function ArchiveRecordBottomNav({
  archivedWorkOrderId,
  spaceId,
  folderId,
}: ArchiveRecordBottomNavProps) {
  const searchParams = useSearchParams();
  const activeTab = parseArchiveRecordTab(searchParams.get("tab"));
  const activeTabLinkRef = useRef<HTMLAnchorElement | null>(null);
  const recordBase = getArchiveRecordHref(archivedWorkOrderId);
  const archiveListHref = `${getSpaceArchiveHref(spaceId)}?folder=${encodeURIComponent(folderId)}`;

  function hrefForTab(tabId: (typeof archiveRecordTabItems)[number]["id"]) {
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    const query = params.toString();
    return query ? `${recordBase}?${query}` : recordBase;
  }

  useLayoutEffect(() => {
    activeTabLinkRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

  return (
    <BottomNavScrollArea
      aria-label="Archived record sections"
      innerClassName="min-h-[4rem] gap-1 px-2.5 py-2 sm:px-3"
    >
      <Link
        href={archiveListHref}
        className={bottomNavItemClasses(false)}
        title="Back to archive"
      >
        <span className={BOTTOM_NAV_ICON_BOX}>
          <ArrowLeft className="h-[1.15rem] w-[1.15rem] stroke-[2.5] text-current" aria-hidden />
        </span>
        <BottomNavLabel>Back</BottomNavLabel>
      </Link>
      <div className="mx-0.5 h-8 w-px shrink-0 bg-slate-200 dark:bg-white/15" aria-hidden />
      {archiveRecordTabItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            ref={isActive ? activeTabLinkRef : undefined}
            href={hrefForTab(item.id)}
            className={bottomNavItemClasses(isActive)}
            title={item.label}
            scroll={false}
          >
            <span className={BOTTOM_NAV_ICON_BOX}>
              <Icon className="h-[1.15rem] w-[1.15rem] stroke-[2.35] text-current" aria-hidden />
            </span>
            <BottomNavLabel>{item.label}</BottomNavLabel>
          </Link>
        );
      })}
    </BottomNavScrollArea>
  );
}
