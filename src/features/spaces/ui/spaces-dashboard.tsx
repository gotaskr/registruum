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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none"
          >
            <Plus className="h-4 w-4" />
            Create Space
          </button>
        }
      >
        {spaces.length === 0 ? (
          <section className="grid min-h-[calc(100vh-13rem)] place-items-center px-6 py-10">
            <div className="max-w-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-accent-soft text-accent">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-foreground">
                Start with your first space
              </h2>
              <p className="mt-3 text-base text-muted">
                Spaces are your top-level organizations. Once you create one, you can add workorders, invite your team, and manage a dedicated archive.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none"
              >
                <Plus className="h-4 w-4" />
                Create Space
              </button>
            </div>
          </section>
        ) : (
          <section className="px-6 py-8 lg:px-8">
            <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
              {spaces.map((space) => (
                <Link
                  key={space.id}
                  href={getSpaceEntryHref(space)}
                  className="group rounded-[2rem] border border-border bg-panel p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] transition-transform hover:-translate-y-0.5 dark:shadow-none"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <SpaceAvatar
                        name={space.name}
                        photoUrl={space.photoUrl}
                        className="h-16 w-16 rounded-[1.5rem]"
                        fallbackClassName="border border-border"
                      />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                          Space
                        </p>
                        <h2 className="mt-3 text-2xl font-semibold text-foreground">
                          {space.name}
                        </h2>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {space.spaceType ? (
                        <span className="inline-flex rounded-full bg-panel-muted px-3 py-1 text-xs font-semibold text-muted">
                          {getSpaceTypeLabel(space.spaceType)}
                        </span>
                      ) : null}
                      <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                        {space.membershipRole ? formatRoleLabel(space.membershipRole) : "Assigned"}
                      </span>
                    </div>
                  </div>

                  {space.address ? (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-panel-muted px-3 py-1.5 text-sm text-muted">
                      <MapPin className="h-4 w-4 text-muted" />
                      <span>{space.address}</span>
                    </div>
                  ) : null}

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
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
