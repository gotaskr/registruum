import { notFound } from "next/navigation";
import { getArchiveFolderOptions } from "@/features/archive/api/archive";
import { getWorkOrderMessages } from "@/features/chat/api/messages";
import { getWorkOrderDocuments } from "@/features/documents/api/documents";
import { getWorkOrderLogs } from "@/features/logs/api/activity-logs";
import { getWorkOrderMembers } from "@/features/members/api/work-order-members";
import { canAccessWorkOrderModule } from "@/features/permissions/lib/work-order-permissions";
import {
  getWorkOrderActorContext,
  getWorkOrderMemberCount,
  getWorkOrderOverviewData,
  getWorkOrderSettingsData,
} from "@/features/work-orders/api/work-orders";
import { WorkOrderModuleScreen } from "@/features/work-orders/ui/work-order-module-screen";
import { isWorkOrderModule } from "@/lib/constants";

type WorkOrderModulePageProps = Readonly<{
  params: Promise<{
    spaceId: string;
    workOrderId: string;
    module: string;
  }>;
}>;

export default async function WorkOrderModulePage({
  params,
}: WorkOrderModulePageProps) {
  const { spaceId, workOrderId, module } = await params;

  if (!isWorkOrderModule(module)) {
    notFound();
  }

  const context = await getWorkOrderActorContext(spaceId, workOrderId);

  if (!canAccessWorkOrderModule(module, context.permissions)) {
    notFound();
  }

  const messages =
    module === "chat" ? await getWorkOrderMessages(spaceId, workOrderId) : [];
  const documentData =
    module === "documents"
      ? await getWorkOrderDocuments(spaceId, workOrderId)
      : { folders: [], documents: [] };
  const memberData =
    module === "members" || module === "settings"
      ? await getWorkOrderMembers(spaceId, workOrderId)
      : { members: [], pendingInvites: [] };
  const logs = module === "logs" ? await getWorkOrderLogs(spaceId, workOrderId) : [];
  const chatMemberCount =
    module === "chat" ? await getWorkOrderMemberCount(spaceId, workOrderId) : 0;
  const overview =
    module === "overview"
      ? await getWorkOrderOverviewData(spaceId, workOrderId)
      : undefined;
  const archiveFolderData =
    module === "overview"
      ? await getArchiveFolderOptions(spaceId)
      : { folders: [], defaultFolderId: "" as const };
  const settingsData =
    module === "settings"
      ? await getWorkOrderSettingsData(spaceId, workOrderId)
      : undefined;

  return (
    <WorkOrderModuleScreen
      module={module}
      workOrder={context.workOrder}
      actorRole={context.actorRole}
      actorUserId={context.user.id}
      actorName={context.profile.fullName}
      permissions={context.permissions}
      chatMemberCount={chatMemberCount}
      messages={messages}
      members={memberData.members}
      pendingInvites={memberData.pendingInvites}
      logs={logs}
      documentFolders={documentData.folders}
      documents={documentData.documents}
      overview={overview}
      settingsData={settingsData}
      archiveFolders={archiveFolderData.folders}
      defaultArchiveFolderId={archiveFolderData.defaultFolderId}
    />
  );
}
