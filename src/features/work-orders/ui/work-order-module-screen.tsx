import type { ReactNode } from "react";
import { MapPin, MoreHorizontal } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChatPanel } from "@/features/chat/ui/chat-panel";
import { DocumentPanel } from "@/features/documents/ui/document-panel";
import type {
  WorkOrderDocumentFolder,
  WorkOrderDocumentRecord,
} from "@/features/documents/types/document-browser";
import { LogList } from "@/features/logs/ui/log-list";
import { LogAuditExportButton } from "@/features/logs/ui/log-audit-export-button";
import { MemberList } from "@/features/members/ui/member-list";
import type {
  WorkOrderMember,
  WorkOrderPendingInvite,
} from "@/features/members/types/work-order-member";
import {
  getLockedWorkOrderMessage,
  type WorkOrderPermissionSet,
} from "@/features/permissions/lib/work-order-permissions";
import type { WorkOrderOverviewData } from "@/features/work-orders/types/work-order-overview";
import type { WorkOrderSettingsData } from "@/features/work-orders/types/work-order-settings";
import { WorkOrderOverview } from "@/features/work-orders/ui/work-order-overview";
import { WorkOrderSettingsPanel } from "@/features/work-orders/ui/work-order-settings-panel";
import { formatRoleLabel, formatWorkOrderLocation } from "@/lib/utils";
import type { SpaceMembershipRole } from "@/types/database";
import type { LogEntry } from "@/types/log";
import type { Message } from "@/types/message";
import type { WorkOrder, WorkOrderModule } from "@/types/work-order";

type WorkOrderModuleScreenProps = Readonly<{
  module: WorkOrderModule;
  workOrder: WorkOrder;
  actorRole: SpaceMembershipRole;
  actorUserId: string;
  actorName: string;
  permissions: WorkOrderPermissionSet;
  chatMemberCount?: number;
  messages?: Message[];
  members?: WorkOrderMember[];
  pendingInvites?: WorkOrderPendingInvite[];
  logs?: LogEntry[];
  documentFolders?: WorkOrderDocumentFolder[];
  documents?: WorkOrderDocumentRecord[];
  overview?: WorkOrderOverviewData;
  settingsData?: WorkOrderSettingsData;
}>;

export function WorkOrderModuleScreen({
  module,
  workOrder,
  actorRole,
  actorUserId,
  actorName,
  permissions,
  chatMemberCount = 0,
  messages = [],
  members = [],
  pendingInvites = [],
  logs = [],
  documentFolders = [],
  documents = [],
  overview,
  settingsData,
}: WorkOrderModuleScreenProps) {
  const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);
  const lockedMessage = getLockedWorkOrderMessage(workOrder.status);
  const overviewData = overview ?? {
    createdByName: "Unknown User",
    memberCount: 0,
    documentCount: 0,
    photoCount: 0,
    photos: [],
    activityCount: 0,
    recentLogs: [],
  };
  let content: ReactNode;
  let subheader: ReactNode | undefined;
  let actions: ReactNode = (
    <button
      type="button"
      className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-panel-muted hover:text-foreground"
    >
      <MoreHorizontal className="h-4 w-4" />
    </button>
  );

  switch (module) {
    case "overview":
      content = <WorkOrderOverview workOrder={workOrder} overview={overviewData} />;
      subheader = <p className="text-sm text-muted">Overview</p>;
      break;
    case "chat":
      content = (
        <ChatPanel
          workOrderName={workOrder.title}
          status={workOrder.status}
          memberCount={chatMemberCount}
          messages={messages}
          spaceId={workOrder.spaceId}
          workOrderId={workOrder.id}
          actorUserId={actorUserId}
          actorName={actorName}
          canSendMessage={permissions.canSendMessage}
          lockedMessage={lockedMessage}
        />
      );
      subheader = undefined;
      break;
    case "documents":
      content = (
        <DocumentPanel
          spaceId={workOrder.spaceId}
          workOrderId={workOrder.id}
          folders={documentFolders}
          documents={documents}
          canUploadDocuments={permissions.canUploadDocuments}
          canDeleteDocuments={permissions.canDeleteDocuments}
          lockedMessage={lockedMessage}
        />
      );
      subheader = (
        <p className="text-sm text-muted">
          {documentFolders.length} folders / {documents.length} items
        </p>
      );
      break;
    case "members":
      content = (
        <MemberList
          members={members}
          pendingInvites={pendingInvites}
          spaceId={workOrder.spaceId}
          workOrderId={workOrder.id}
          canManageMembers={permissions.canManageMembers}
          canInvitePeople={permissions.canInvitePeople}
          canChangeMemberRoles={permissions.canChangeMemberRoles}
          canRemovePeople={permissions.canRemovePeople}
          actorRole={actorRole}
          actorUserId={actorUserId}
          lockedMessage={lockedMessage}
        />
      );
      subheader = (
        <p className="text-sm text-muted">
          {members.length} assigned members / You are acting as {formatRoleLabel(actorRole)}
        </p>
      );
      break;
    case "logs":
      content = <LogList logs={logs} />;
      actions = <LogAuditExportButton workOrder={workOrder} logs={logs} />;
      subheader = (
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">
            Work order summary
          </p>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            {workOrder.description ?? "No description has been added yet."}
          </p>
        </div>
      );
      break;
    case "settings":
      content = (
        <WorkOrderSettingsPanel
          workOrder={workOrder}
          members={members}
          settingsData={settingsData}
          permissions={permissions}
        />
      );
      actions = undefined;
      subheader = undefined;
      break;
  }

  return (
    <>
      <RealtimeRouteRefresh
        channelName={`work-order:${workOrder.id}:${module}`}
        subscriptions={[
          { table: "work_orders", filter: `id=eq.${workOrder.id}` },
          { table: "work_order_memberships", filter: `work_order_id=eq.${workOrder.id}` },
          { table: "documents", filter: `work_order_id=eq.${workOrder.id}` },
          { table: "activity_logs", filter: `work_order_id=eq.${workOrder.id}` },
        ]}
      />
      <MainShell
        title={workOrder.title}
        meta={
          <>
            <StatusBadge status={workOrder.status} />
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5" />
              {formatWorkOrderLocation(workOrder.locationLabel, workOrder.unitLabel)}
            </span>
            <span className="text-sm text-muted">/</span>
            <span className="text-sm text-muted">{moduleLabel}</span>
          </>
        }
        actions={
          actions
        }
        subheader={subheader}
      >
        {content}
      </MainShell>
    </>
  );
}
