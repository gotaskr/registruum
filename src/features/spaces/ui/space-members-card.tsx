"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { SpaceInfoCard } from "@/features/spaces/ui/space-info-card";
import { cn } from "@/lib/utils";
import type { SpaceOverviewMember } from "@/features/spaces/types/space-overview";

type SpaceMembersCardProps = Readonly<{
  members: SpaceOverviewMember[];
}>;

export function SpaceMembersCard({
  members,
}: SpaceMembersCardProps) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const previewMembers = members.slice(0, 3);
  const remainingCount = Math.max(members.length - previewMembers.length, 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="block w-full text-left"
      >
        <SpaceInfoCard
          label="Members"
          value={members.length}
          helper="View who is in this space"
          orientation="horizontal"
        >
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center -space-x-2">
              {previewMembers.length === 0 ? (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-panel-muted text-muted">
                  <Users className="h-4 w-4" />
                </span>
              ) : (
                previewMembers.map((member) => (
                  <span
                    key={member.id}
                    className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-panel bg-panel-muted text-xs font-semibold text-foreground"
                  >
                    {member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        width={36}
                        height={36}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      member.initials
                    )}
                  </span>
                ))
              )}
              {remainingCount > 0 ? (
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-panel bg-panel-muted px-2 text-xs font-semibold text-muted">
                  +{remainingCount}
                </span>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              Details
              <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-180" : "")} />
            </span>
          </div>
        </SpaceInfoCard>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-full min-w-[20rem] rounded-2xl bg-panel p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] ring-1 ring-border">
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-start gap-3 rounded-xl bg-panel-muted px-4 py-3"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel text-xs font-semibold text-foreground">
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    member.initials
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {member.workOrderTitles.length > 0
                      ? `\u2192 ${member.workOrderTitles.join(", ")}`
                      : "\u2192 No active work orders"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
