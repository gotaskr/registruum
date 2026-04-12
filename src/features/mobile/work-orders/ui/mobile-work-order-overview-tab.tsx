/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  FolderOpen,
  MessageSquareMore,
} from "lucide-react";
import { getMobileStatusLabel } from "@/features/mobile/lib/presentation";
import type { MobileWorkOrderDetailsData } from "@/features/mobile/types/mobile";
import { MobileCard, MobileSectionTitle } from "@/features/mobile/ui/mobile-primitives";
import { formatDateLabel } from "@/lib/utils";

type MobileWorkOrderOverviewTabProps = Readonly<{
  data: MobileWorkOrderDetailsData;
  buildTabHref: (tab: "overview" | "chat" | "documents" | "logs") => string;
  onComplete: () => void;
  canShowCompleteAction: boolean;
}>;

export function MobileWorkOrderOverviewTab({
  data,
  buildTabHref,
  onComplete,
  canShowCompleteAction,
}: MobileWorkOrderOverviewTabProps) {
  return (
    <div className="space-y-4">
      {data.archivedMeta ? (
        <MobileCard>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Archive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Archived Record</p>
              <p className="mt-1 text-sm text-slate-500">
                Stored in {data.archivedMeta.folderName} · Archived {data.archivedMeta.archivedAtLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Finalized by {data.archivedMeta.archivedByName}
              </p>
            </div>
          </div>
        </MobileCard>
      ) : null}

      <MobileCard className="space-y-5">
        <div>
          <p className="text-[2rem] font-semibold text-slate-950">{data.workOrder.title}</p>
          <p className="mt-4 text-[1.05rem] leading-7 text-slate-500">
            {data.workOrder.description ?? "No description recorded for this work order."}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Status
            </p>
            <p className="mt-2 text-[1.05rem] font-medium text-slate-950">
              {getMobileStatusLabel(data.workOrder.status)}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Due Date
            </p>
            <p className="mt-2 text-[1.05rem] font-medium text-slate-950">
              {formatDateLabel(data.workOrder.dueDate ?? data.workOrder.expirationAt)}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Created By
            </p>
            <p className="mt-2 truncate text-[1.05rem] font-medium text-slate-950">
              {data.overview.createdByName}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Members
            </p>
            <p className="mt-2 text-[1.05rem] font-medium text-slate-950">
              {data.members.length} assigned
            </p>
          </div>
        </div>
      </MobileCard>

      <MobileCard>
        <MobileSectionTitle title="Quick Actions" />
        <div className="grid grid-cols-3 gap-3">
          <Link
            href={buildTabHref("chat")}
            className="flex min-h-[8rem] flex-col items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-white text-[1.05rem] font-medium text-slate-700"
          >
            <MessageSquareMore className="h-7 w-7 text-[#3566d6]" />
            Chat
          </Link>
          <Link
            href={buildTabHref("documents")}
            className="flex min-h-[8rem] flex-col items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-white text-[1.05rem] font-medium text-slate-700"
          >
            <FolderOpen className="h-7 w-7 text-[#3566d6]" />
            Documents
          </Link>
          {canShowCompleteAction ? (
            <button
              type="button"
              onClick={onComplete}
              className="flex min-h-[8rem] flex-col items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-white text-[1.05rem] font-medium text-slate-700"
            >
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              Complete
            </button>
          ) : (
            <div className="flex min-h-[8rem] flex-col items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 text-[1.05rem] font-medium text-slate-400">
              <CheckCircle2 className="h-7 w-7" />
              Locked
            </div>
          )}
        </div>
      </MobileCard>

      <MobileCard>
        <MobileSectionTitle title="Assigned Members" />
        <div className="space-y-3">
          {data.members.slice(0, 4).map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{member.name}</p>
                <p className="mt-1 text-sm text-slate-500">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </MobileCard>

      <MobileCard>
        <MobileSectionTitle title="Photo Preview" />
        {data.overview.photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {data.overview.photos.slice(0, 4).map((photo) => (
              <img
                key={photo.id}
                src={photo.previewUrl}
                alt={photo.title}
                className="h-28 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No photos uploaded yet.</p>
        )}
      </MobileCard>

      <MobileCard>
        <MobileSectionTitle title="Latest Activity" />
        <div className="space-y-3">
          {data.overview.recentLogs.length > 0 ? (
            data.overview.recentLogs.map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-950">{entry.action}</p>
                <p className="mt-1 text-sm text-slate-500">{entry.details ?? entry.actorName}</p>
                <p className="mt-2 text-xs text-slate-400">{entry.createdAt}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No recent activity yet.</p>
          )}
        </div>
      </MobileCard>
    </div>
  );
}
