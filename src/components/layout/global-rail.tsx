"use client";

import { Archive, BriefcaseBusiness, Building2, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CreateSpaceModal } from "@/features/spaces/ui/create-space-modal";
import { getDashboardHref, getSettingsHref, getSpaceEntryHref } from "@/lib/route-utils";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/profile";
import type { Space } from "@/types/space";

type GlobalRailProps = Readonly<{
  currentSpaceId?: string;
  spaces: Space[];
  profile: Profile;
  activeView?: "spaces" | "jobMarket" | "settings";
}>;

export function GlobalRail({
  currentSpaceId,
  spaces,
  profile,
  activeView = "spaces",
}: GlobalRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateSpaceOpen = searchParams.get("create-space") === "1";

  const currentQueryString = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  const openCreateSpaceModal = useCallback(() => {
    const nextParams = new URLSearchParams(currentQueryString.toString());
    nextParams.set("create-space", "1");
    const nextQuery = nextParams.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [currentQueryString, pathname, router]);

  const closeCreateSpaceModal = useCallback(() => {
    const nextParams = new URLSearchParams(currentQueryString.toString());
    nextParams.delete("create-space");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [currentQueryString, pathname, router]);

  return (
    <>
      <aside className="border-b border-[#2a2f39] bg-[#1d2129] text-slate-100 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-row items-center gap-3 px-3 py-4 lg:flex-col lg:items-center lg:gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#4d8dff] text-base font-semibold text-white">
            R
          </div>

          <div className="flex flex-1 gap-2 overflow-x-auto lg:flex-col lg:items-center lg:overflow-x-visible">
            {spaces.map((space) => {
              const isActive = space.id === currentSpaceId;

              return (
                <Link
                  key={space.id}
                  href={getSpaceEntryHref(space)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors",
                    isActive
                      ? "bg-[#213658] text-[#6ea0ff]"
                      : "bg-transparent text-[#98a3b7] hover:bg-[#252b37] hover:text-white",
                  )}
                  title={space.name}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="sr-only">{space.name}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={openCreateSpaceModal}
              className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[#98a3b7] transition-colors hover:bg-[#252b37] hover:text-white"
              title="Create Space"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Create Space</span>
            </button>
          </div>

          <div className="hidden lg:block">
            <div className="space-y-2 border-t border-[#2a3040] pt-4">
              <Link
                href={getDashboardHref()}
                className="flex h-11 w-11 items-center justify-center rounded-[10px] text-[#98a3b7] transition-colors hover:bg-[#252b37] hover:text-white"
                title="Archive"
              >
                <Archive className="h-4 w-4" />
              </Link>
              <Link
                href={getDashboardHref()}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors",
                  activeView === "jobMarket"
                    ? "bg-[#213658] text-[#6ea0ff]"
                    : "text-[#98a3b7] hover:bg-[#252b37] hover:text-white",
                )}
                title="Job Market"
              >
                <BriefcaseBusiness className="h-4 w-4" />
              </Link>
              <Link
                href={getSettingsHref()}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-[10px] transition-colors",
                  activeView === "settings"
                    ? "bg-[#213658] text-[#6ea0ff]"
                    : "text-[#98a3b7] hover:bg-[#252b37] hover:text-white",
                )}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Link>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2a3040] text-xs font-semibold text-white"
                title={profile.fullName}
              >
                {getInitials(profile.fullName)}
              </div>
            </div>
          </div>
        </div>
      </aside>
      {isCreateSpaceOpen ? (
        <CreateSpaceModal open={isCreateSpaceOpen} onClose={closeCreateSpaceModal} />
      ) : null}
    </>
  );
}
