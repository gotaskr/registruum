"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Download,
  FileText,
  FolderArchive,
  LockKeyhole,
  Logs,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChatMessageItem } from "@/components/ui/chat-message-item";
import type { ArchivedWorkOrderDetails } from "@/features/archive/types/archive";
import { WorkOrderPhotoCarousel } from "@/features/work-orders/ui/work-order-photo-carousel";
import { formatWorkOrderLocation, getInitials } from "@/lib/utils";

type ArchiveDetailsTab = "overview" | "documents" | "chat" | "members" | "logs";

const tabDefinitions: ReadonlyArray<{
  id: ArchiveDetailsTab;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "overview", label: "Overview", icon: FolderArchive },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "chat", label: "Chat", icon: MessageSquareText },
  { id: "members", label: "Members", icon: UsersRound },
  { id: "logs", label: "Logs", icon: Logs },
];

function EmptyArchiveSection({
  title,
  copy,
}: Readonly<{
  title: string;
  copy: string;
}>) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-border bg-panel-muted/50 px-5 py-9 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{copy}</p>
    </div>
  );
}

type ArchiveRecordDetailViewProps = Readonly<{
  details: ArchivedWorkOrderDetails;
}>;

export function ArchiveRecordDetailView({
  details,
}: ArchiveRecordDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ArchiveDetailsTab>("overview");
  const archiveHref = `/archive?space=${details.spaceId}&folder=${details.folderId}`;
  const selectedTabDefinition = useMemo(
    () => tabDefinitions.find((tab) => tab.id === activeTab) ?? tabDefinitions[0],
    [activeTab],
  );

  function renderTabContent() {
    switch (activeTab) {
      case "overview":
        return (
          <section className="space-y-6 px-6 py-8 lg:px-8">
            <div className="rounded-[2rem] border border-border bg-panel px-6 py-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    Archived Summary
                  </p>
                  <p className="mt-4 text-base leading-7 text-foreground">
                    {details.workOrder.description?.trim()
                      ? details.workOrder.description
                      : "No description was recorded for this work order."}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
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

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Documents
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {details.overview.documentCount}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Members
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {details.overview.memberCount}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Activity
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {details.overview.activityCount}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Finalized
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {details.archivedAtLabel}
                </p>
              </div>
            </div>
          </section>
        );
      case "documents":
        return (
          <section className="space-y-5 px-6 py-8 lg:px-8">
            <div className="flex flex-wrap gap-2">
              {details.documentFolders.map((folder) => (
                <span
                  key={folder.id}
                  className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-muted"
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
                    className="flex flex-col gap-3 rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between"
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
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-4 text-sm font-semibold text-foreground transition-colors hover:bg-panel-muted"
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
          <section className="space-y-4 px-6 py-8 lg:px-8">
            {details.messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
          </section>
        ) : (
          <div className="px-6 py-8 lg:px-8">
            <EmptyArchiveSection
              title="No chat messages"
              copy="No chat history was recorded on this work order."
            />
          </div>
        );
      case "members":
        return details.members.length > 0 ? (
          <section className="space-y-3 px-6 py-8 lg:px-8">
            {details.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
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
          <div className="px-6 py-8 lg:px-8">
            <EmptyArchiveSection
              title="No members listed"
              copy="No assigned members were found for this archived work order."
            />
          </div>
        );
      case "logs":
        return details.logs.length > 0 ? (
          <section className="space-y-4 px-6 py-8 lg:px-8">
            {details.logs.map((log) => (
              <div
                key={log.id}
                className="rounded-[1.75rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
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
          <div className="px-6 py-8 lg:px-8">
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
      meta={
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm text-muted">
            <LockKeyhole className="h-4 w-4" />
            Archived record
          </span>
          <StatusBadge status="archived" />
          <span className="text-sm text-muted">{details.spaceName}</span>
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <Clock3 className="h-4 w-4" />
            {details.archivedAtLabel}
          </span>
        </>
      }
      actions={
        <Link
          href={archiveHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-4 text-sm font-semibold text-foreground transition-colors hover:bg-panel-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Archive
        </Link>
      }
      subheader={
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-border bg-panel px-5 py-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  Archived Record
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
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
                <p className="mt-4 text-sm leading-6 text-muted">
                  This record stays frozen in the archive so your team can review the final state,
                  files, chat, members, and audit history without reopening the work order.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-panel-muted/60 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                  Archive Snapshot
                </p>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  <p>
                    Space <span className="font-medium text-foreground">{details.spaceName}</span>
                  </p>
                  <p>
                    Folder <span className="font-medium text-foreground">{details.folderName}</span>
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-accent" />
                    <span className="font-medium text-foreground">{details.archivedAtLabel}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabDefinitions.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition-colors",
                    activeTab === tab.id
                      ? "border-accent bg-accent text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)]"
                      : "border-border bg-panel text-foreground hover:bg-panel-muted",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border bg-panel-muted/50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Showing {selectedTabDefinition.label}
            </p>
            <Link
              href={archiveHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent"
            >
              Return to folder
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      }
    >
      {renderTabContent()}
    </MainShell>
  );
}
