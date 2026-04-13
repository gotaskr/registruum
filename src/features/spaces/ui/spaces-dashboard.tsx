"use client";

import { useState } from "react";
import { ArrowRight, Building2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { MainShell } from "@/components/layout/main-shell";
import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { getSpaceTypeLabel } from "@/features/spaces/lib/space-types";
import { CreateSpaceModal } from "@/features/spaces/ui/create-space-modal";
import { SpaceAvatar } from "@/features/spaces/ui/space-avatar";
import { getSpaceEntryHref } from "@/lib/route-utils";
import { formatRoleLabel } from "@/lib/utils";
import type { Space } from "@/types/space";

type SpacesDashboardProps = Readonly<{
  spaces: Space[];
}>;

export function SpacesDashboard({
  spaces,
}: SpacesDashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <RealtimeRouteRefresh
        channelName="dashboard:spaces"
        subscriptions={[
          { table: "spaces" },
          { table: "space_memberships" },
          { table: "invites" },
        ]}
      />
      <MainShell
        title="Active Spaces"
        description="Browse the organizations you belong to and jump into their active work."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none sm:h-11 lg:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Space
          </button>
        }
      >
        {spaces.length === 0 ? (
          <section className="grid min-h-[calc(100dvh-12rem)] place-items-center px-4 py-10 sm:px-6">
            <div className="w-full max-w-md text-center sm:max-w-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-accent-soft text-accent">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Start with your first space
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Spaces are your top-level organizations. Once you create one, you can add workorders, invite your team, and manage a dedicated archive.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none sm:h-11 sm:w-auto sm:max-w-none"
              >
                <Plus className="h-4 w-4" />
                Create Space
              </button>
            </div>
          </section>
        ) : (
          <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto grid max-w-6xl gap-4 sm:gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {spaces.map((space) => (
                <Link
                  key={space.id}
                  href={getSpaceEntryHref(space)}
                  className="group flex flex-col rounded-2xl border border-border bg-panel p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-[transform,box-shadow] active:scale-[0.99] sm:rounded-[2rem] sm:p-6 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_22px_44px_rgba(15,23,42,0.08)] dark:shadow-none dark:sm:hover:shadow-none"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <SpaceAvatar
                      name={space.name}
                      photoUrl={space.photoUrl}
                      className="h-14 w-14 shrink-0 rounded-[1.25rem] sm:h-16 sm:w-16 sm:rounded-[1.5rem]"
                      fallbackClassName="border border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                        Space
                      </p>
                      <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:mt-3 sm:text-2xl">
                        {space.name}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {space.spaceType ? (
                          <span className="inline-flex rounded-full bg-panel-muted px-3 py-1 text-xs font-semibold text-muted">
                            {getSpaceTypeLabel(space.spaceType)}
                          </span>
                        ) : null}
                        <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                          {space.membershipRole
                            ? formatRoleLabel(space.membershipRole)
                            : "Assigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {space.address ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-panel-muted px-3 py-2 text-sm text-muted sm:mt-5 sm:inline-flex sm:items-center sm:rounded-full sm:py-1.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted sm:mt-0" />
                      <span className="min-w-0 leading-snug">{space.address}</span>
                    </div>
                  ) : null}

                  <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-soft py-3 text-sm font-semibold text-accent transition-colors group-hover:bg-accent group-hover:text-white sm:mt-6 sm:w-auto sm:justify-start sm:bg-transparent sm:py-0 sm:text-accent sm:group-hover:bg-transparent sm:group-hover:text-accent">
                    Open space
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </MainShell>

      <CreateSpaceModal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
