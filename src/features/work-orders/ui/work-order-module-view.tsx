/*
import { MapPin, MoreHorizontal, Upload, UserPlus } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChatPanel } from "@/features/chat/ui/chat-panel";
import { DocumentPanel } from "@/features/documents/ui/document-panel";
import { LogList } from "@/features/logs/ui/log-list";
import { MemberList } from "@/features/members/ui/member-list";
import { UpdateWorkOrderForm } from "@/features/work-orders/ui/update-work-order-form";
import { formatWorkOrderLocation } from "@/lib/utils";
import type { LogEntry } from "@/types/log";
import type { Member } from "@/types/member";
import type { Message } from "@/types/message";
import type { WorkOrder, WorkOrderModule } from "@/types/work-order";

type DocumentFolder = Readonly<{
  id: string;
  name: string;
  itemCount: number;
}>;

type WorkOrderModuleViewProps = Readonly<{
  module: WorkOrderModule;
  workOrder: WorkOrder;
  messages: Message[];
  members: Member[];
  logs: LogEntry[];
  documentFolders: DocumentFolder[];
}>;

export function WorkOrderModuleView({
  module,
  workOrder,
  messages,
  members,
  logs,
  documentFolders,
}: WorkOrderModuleViewProps) {
  const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);
  const canEdit = ["open", "in_progress"].includes(workOrder.status);
  const content = {
    chat: <ChatPanel messages={messages} />,
    documents: <DocumentPanel folders={documentFolders} />,
    members: <MemberList members={members} />,
    logs: <LogList logs={logs} />,
    settings: <UpdateWorkOrderForm workOrder={workOrder} canEdit={canEdit} />,
  }[module];

  return (
    <MainShell
      title={workOrder.title}
      meta={
        <>
          <StatusBadge status={workOrder.status} />
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {formatWorkOrderLocation(workOrder.locationLabel, workOrder.unitLabel)}
          </span>
          <span className="text-sm text-muted">·</span>
          <span className="text-sm text-muted">{moduleLabel}</span>
        </>
      }
      actions={
        <>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </>
      }
      subheader={
        module === "members" ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">{members.length} members</p>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#4d8dff] px-4 text-sm font-semibold text-white"
            >
              <UserPlus className="h-4 w-4" />
              Invite
            </button>
          </div>
        ) : module === "documents" ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted">Folders and files for this work order</p>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-border bg-panel-muted px-4 text-sm font-semibold text-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">
              Work order summary
            </p>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              {workOrder.description ?? "No description has been added yet."}
            </p>
          </div>
        )
      }
    >
      {content}
    </MainShell>
  );
}
*/

export { WorkOrderModuleScreen as WorkOrderModuleView } from "@/features/work-orders/ui/work-order-module-screen";
