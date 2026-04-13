"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Download,
  FolderArchive,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BottomNavScrollArea } from "@/components/layout/bottom-nav-scroll-area";
import { MainShell } from "@/components/layout/main-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChatMessageItem } from "@/components/ui/chat-message-item";
import {
  archiveRecordTabItems,
  parseArchiveRecordTab,
  type ArchiveRecordDetailTab,
} from "@/features/archive/lib/archive-record-detail-tabs";
import type { ArchivedWorkOrderDetails } from "@/features/archive/types/archive";
import { WorkOrderPhotoCarousel } from "@/features/work-orders/ui/work-order-photo-carousel";
import { getSpaceArchiveHref } from "@/lib/route-utils";
import { cn, formatWorkOrderLocation, getInitials } from "@/lib/utils";

function EmptyArchiveSection({
  title,
  copy,
}: Readonly<{
  title: string;
  copy: string;
}>) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-panel-muted/50 px-4 py-6 text-center sm:rounded-[1.75rem] sm:px-5 sm:py-9">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{copy}</p>
    </div>
  );
}

type ArchiveRecordDetailViewProps = Readonly<{
  details: ArchivedWorkOrderDetails;
}>;

const tabContentPad = "px-4 py-5 sm:px-6 sm:py-8 lg:px-8";

export function ArchiveRecordDetailView({
  details,
}: ArchiveRecordDetailViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseArchiveRecordTab(searchParams.get("tab"));
  const archiveHref = `${getSpaceArchiveHref(details.spaceId)}?folder=${encodeURIComponent(details.folderId)}`;
  const selectedTabDefinition = useMemo(
    () =>
      archiveRecordTabItems.find((tab) => tab.id === activeTab) ?? archiveRecordTabItems[0],
    [activeTab],
  );

  function goToTab(next: ArchiveRecordDetailTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function renderTabContent() {
    switch (activeTab) {
      case "overview":
        return (
          <section className={cn("space-y-4 sm:space-y-6", tabContentPad)}>
            <div className="rounded-xl border border-border bg-panel p-4 shadow-sm sm:rounded-2xl sm:p-6 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)] lg:rounded-[2rem]">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted sm:text-xs sm:tracking-[0.22em]">
                    Archived summary
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground sm:mt-4 sm:text-base sm:leading-7">
                    {details.workOrder.description?.trim()
                      ? details.workOrder.description
                      : "No description was recorded for this work order."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 sm:mt-6">
                    <StatusBadge status={details.workOrder.status} />
                    <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-muted">
                      {formatWorkOrderLocation(
                        details.workOrder.locationLabel,
                        details.workOrder.unitLabel,
                      )}
                    </span>
                    <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-muted">
                      Priority {details.workOrder.priority}
                    </span>
                  </div>
                </div>
                <WorkOrderPhotoCarousel photos={details.overview.photos} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-panel px-3 py-3 shadow-sm sm:rounded-[1.75rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.2em]">
                  Documents
                </p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground sm:mt-2 sm:text-2xl">
                  {details.overview.documentCount}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-panel px-3 py-3 shadow-sm sm:rounded-[1.75rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.2em]">
                  Members
                </p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground sm:mt-2 sm:text-2xl">
                  {details.overview.memberCount}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-panel px-3 py-3 shadow-sm sm:rounded-[1.75rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.2em]">
                  Activity
                </p>
                <p className="mt-1.5 text-lg font-semibold tabular-nums text-foreground sm:mt-2 sm:text-2xl">
                  {details.overview.activityCount}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-panel px-3 py-3 shadow-sm sm:rounded-[1.75rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.2em]">
                  Finalized
                </p>
                <p className="mt-1.5 text-xs font-medium leading-snug text-foreground sm:mt-2 sm:text-sm">
                  {details.archivedAtLabel}
                </p>
              </div>
            </div>
          </section>
        );
      case "documents":
        return (
          <section className={cn("space-y-4 sm:space-y-5", tabContentPad)}>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {details.documentFolders.map((folder) => (
                <span
                  key={folder.id}
                  className="inline-flex rounded-full border border-border bg-panel-muted px-2.5 py-1 text-xs text-muted sm:px-3 sm:py-1.5 sm:text-sm"
                >
                  {folder.name} {folder.itemCount > 0 ? `(${folder.itemCount})` : ""}
                </span>
              ))}
            </div>

            {details.documents.length > 0 ? (
              <div className="space-y-3">
                {details.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-4 shadow-sm sm:rounded-[1.75rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {document.title}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {document.kind} / Added by {document.uploadedByName} / {document.sentAt}
                      </p>
                    </div>
                    {document.downloadUrl ? (
                      <Link
                        href={document.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 w-full shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl border border-border bg-panel px-4 text-sm font-semibold text-foreground transition-colors hover:bg-panel-muted sm:h-11 sm:w-auto sm:rounded-2xl"
                      >
                        <Download className="h-4 w-4" />
                        Open
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">No file link available</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyArchiveSection
                title="No documents stored"
                copy="This archived work order does not have any stored documents."
              />
            )}
          </section>
        );
      case "chat":
        return details.messages.length > 0 ? (
          <section className={cn("space-y-3 sm:space-y-4", tabContentPad)}>
            {details.messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
          </section>
        ) : (
          <div className={tabContentPad}>
            <EmptyArchiveSection
              title="No chat messages"
              copy="No chat history was recorded on this work order."
            />
          </div>
        );
      case "members":
        return details.members.length > 0 ? (
          <section className={cn("space-y-2 sm:space-y-3", tabContentPad)}>
            {details.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-panel p-4 shadow-sm sm:gap-4 sm:rounded-[1.75rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-panel-muted text-sm font-semibold text-foreground">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="truncate text-sm text-muted">{member.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{member.role}</p>
                  <p className="mt-1 text-xs text-muted">{member.assignedAt}</p>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className={tabContentPad}>
            <EmptyArchiveSection
              title="No members listed"
              copy="No assigned members were found for this archived work order."
            />
          </div>
        );
      case "logs":
        return details.logs.length > 0 ? (
          <section className={cn("space-y-3 sm:space-y-4", tabContentPad)}>
            {details.logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-border bg-panel p-4 shadow-sm sm:rounded-[1.75rem] sm:px-5 sm:py-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{log.action}</p>
                    <p className="mt-1 text-sm text-muted">{log.actorName}</p>
                  </div>
                  <span className="text-xs text-muted">{log.createdAt}</span>
                </div>
                {log.details ? (
                  <p className="mt-3 text-sm leading-6 text-muted">{log.details}</p>
                ) : null}
                {log.change?.before || log.change?.after ? (
                  <div className="mt-3 grid gap-3 rounded-xl border border-border bg-panel-muted/40 px-3 py-3 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        Before
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {log.change.before ?? "Not recorded"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                        After
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {log.change.after ?? "Not recorded"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </section>
        ) : (
          <div className={tabContentPad}>
            <EmptyArchiveSection
              title="No activity logs"
              copy="No audit entries were found for this archived work order."
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <MainShell
      title={details.workOrder.title}
      description="Archived record details are preserved here in a read-only Registruum view."
      descriptionClassName="hidden sm:block"
      meta={
        <div className="flex w-full min-w-0 max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:w-auto sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-panel-muted px-2.5 py-1 text-xs text-muted sm:px-3 sm:py-1.5 sm:text-sm">
            <LockKeyhole className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Archived
          </span>
          <StatusBadge status="archived" />
          <span className="shrink-0 truncate text-xs text-muted sm:max-w-none sm:text-sm">
            {details.spaceName}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted sm:text-sm">
            <Clock3 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="max-w-[9rem] truncate sm:max-w-none">{details.archivedAtLabel}</span>
          </span>
        </div>
      }
      actions={
        <Link
          href={archiveHref}
          className="inline-flex h-10 max-w-[11rem] shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-xl border border-border bg-panel px-3 text-xs font-semibold text-foreground transition-colors hover:bg-panel-muted sm:h-11 sm:max-w-none sm:gap-2 sm:rounded-2xl sm:px-4 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate sm:whitespace-normal">Back to archive</span>
        </Link>
      }
      subheader={
        <div className="space-y-3 sm:space-y-4">
          <p className="px-1 text-xs leading-relaxed text-muted sm:hidden">
            Read-only archive: final state, files, chat, members, and history.
          </p>
          <div className="rounded-xl border border-border bg-panel p-4 shadow-sm sm:rounded-2xl sm:p-5 sm:shadow-[0_18px_36px_rgba(15,23,42,0.05)] lg:rounded-[2rem]">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:text-[11px] sm:tracking-[0.24em]">
                  Archived record
                </p>
                <div className="mt-2 hidden flex-wrap items-center gap-2 sm:mt-3 sm:flex">
                  <StatusBadge status="archived" />
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-muted">
                    <FolderArchive className="h-4 w-4 text-accent" />
                    {details.folderName}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-muted">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Archived by {details.archivedByName}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:hidden">
                  Folder <span className="font-medium text-foreground">{details.folderName}</span>
                  {" · "}
                  by {details.archivedByName}
                </p>
                <p className="mt-3 hidden text-sm leading-6 text-muted sm:block">
                  This record stays frozen in the archive so your team can review the final state,
                  files, chat, members, and audit history without reopening the work order.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-panel-muted/60 px-3 py-3 sm:rounded-[1.5rem] sm:px-4 sm:py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.2em]">
                  Archive snapshot
                </p>
                <div className="mt-2 space-y-1.5 text-xs text-muted sm:mt-3 sm:space-y-2 sm:text-sm">
                  <p>
                    Space <span className="font-medium text-foreground">{details.spaceName}</span>
                  </p>
                  <p>
                    Folder <span className="font-medium text-foreground">{details.folderName}</span>
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 shrink-0 text-accent" />
                    <span className="font-medium text-foreground">{details.archivedAtLabel}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="-mx-1 hidden min-w-0 sm:mx-0 lg:block"
            role="tablist"
            aria-label="Record sections"
          >
            <BottomNavScrollArea
              aria-label="Record sections"
              landmark="none"
              innerClassName="gap-2 px-1 sm:px-0"
            >
              {archiveRecordTabItems.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    suppressHydrationWarning
                    onClick={() => goToTab(tab.id)}
                    className={cn(
                      "inline-flex shrink-0 touch-manipulation items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm",
                      selected
                        ? "border-[#2f5fd4] bg-[#2f5fd4] text-white shadow-sm dark:border-[#3d6fd9] dark:bg-[#3d6fd9]"
                        : "border-border bg-panel text-foreground hover:bg-panel-muted",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </BottomNavScrollArea>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-panel-muted/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[1.5rem] sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-xs sm:tracking-[0.18em]">
              {selectedTabDefinition.label}
            </p>
            <Link
              href={archiveHref}
              className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-accent sm:gap-2 sm:self-auto sm:text-sm"
            >
              Back to list
              <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </div>
      }
    >
      {renderTabContent()}
    </MainShell>
  );
}
