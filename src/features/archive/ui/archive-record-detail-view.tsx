"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Download,
  FileText,
  FolderArchive,
  LockKeyhole,
  Logs,
  MessageSquareText,
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
    <div className="rounded-2xl border border-dashed border-border bg-panel-muted/40 px-5 py-8 text-center">
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
  const selectedTabDefinition = useMemo(
    () => tabDefinitions.find((tab) => tab.id === activeTab) ?? tabDefinitions[0],
    [activeTab],
  );

  function renderTabContent() {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6 px-6 py-6">
            <section className="rounded-2xl border border-border bg-panel px-5 py-5">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    Archived Summary
                  </p>
                  <p className="mt-3 text-base leading-7 text-foreground">
                    {details.workOrder.description?.trim()
                      ? details.workOrder.description
                      : "No description was recorded for this work order."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
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
            </section>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-border bg-panel px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Documents
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {details.overview.documentCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-panel px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Members
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {details.overview.memberCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-panel px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Activity
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {details.overview.activityCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-panel px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Finalized
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {details.archivedAtLabel}
                </p>
              </div>
            </div>
          </div>
        );
      case "documents":
        return (
          <div className="space-y-5 px-6 py-6">
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
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-panel px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
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
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-panel px-4 text-sm font-medium text-foreground"
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
          </div>
        );
      case "chat":
        return details.messages.length > 0 ? (
          <div className="space-y-4 px-6 py-6">
            {details.messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-6">
            <EmptyArchiveSection
              title="No chat messages"
              copy="No chat history was recorded on this work order."
            />
          </div>
        );
      case "members":
        return details.members.length > 0 ? (
          <div className="space-y-3 px-6 py-6">
            {details.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-panel px-4 py-4"
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
          </div>
        ) : (
          <div className="px-6 py-6">
            <EmptyArchiveSection
              title="No members listed"
              copy="No assigned members were found for this archived work order."
            />
          </div>
        );
      case "logs":
        return details.logs.length > 0 ? (
          <div className="space-y-4 px-6 py-6">
            {details.logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-border bg-panel px-4 py-4">
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
          </div>
        ) : (
          <div className="px-6 py-6">
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
      description="Archived record details are preserved here in read-only form."
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
          href={`/archive?folder=${details.folderId}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-panel px-4 text-sm font-medium text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Archive
        </Link>
      }
      subheader={
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Folder: <span className="font-medium text-foreground">{details.folderName}</span> /
            Archived by{" "}
            <span className="font-medium text-foreground">{details.archivedByName}</span>
          </p>
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
                    "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-border bg-panel text-foreground hover:bg-panel-muted",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Showing {selectedTabDefinition.label}
          </p>
        </div>
      }
    >
      {renderTabContent()}
    </MainShell>
  );
}
