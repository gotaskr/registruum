import "server-only";

import { getArchivedWorkOrderDetails } from "@/features/archive/api/archive";
import { getWorkOrderMessages } from "@/features/chat/api/messages";
import { getWorkOrderDocuments } from "@/features/documents/api/documents";
import { getWorkOrderLogs } from "@/features/logs/api/activity-logs";
import { getWorkOrderMembers } from "@/features/members/api/work-order-members";
import { getLockedWorkOrderMessage } from "@/features/permissions/lib/work-order-permissions";
import { getSpaceByIdForUser } from "@/features/spaces/api/spaces";
import type { MobileWorkOrderDetailsData } from "@/features/mobile/types/mobile";
import {
  getWorkOrderActorContext,
  getWorkOrderOverviewData,
} from "@/features/work-orders/api/work-orders";

export async function getMobileWorkOrderDetailsData(
  spaceId: string,
  workOrderId: string,
): Promise<MobileWorkOrderDetailsData> {
  const [space, context, overview, memberData, documentData, messages, logs] =
    await Promise.all([
      getSpaceByIdForUser(spaceId),
      getWorkOrderActorContext(spaceId, workOrderId),
      getWorkOrderOverviewData(spaceId, workOrderId),
      getWorkOrderMembers(spaceId, workOrderId),
      getWorkOrderDocuments(spaceId, workOrderId),
      getWorkOrderMessages(spaceId, workOrderId),
      getWorkOrderLogs(spaceId, workOrderId),
    ]);

  return {
    space: {
      id: space.id,
      name: space.name,
    },
    workOrder: context.workOrder,
    actorUserId: context.user.id,
    actorName: context.profile.fullName,
    overview,
    members: memberData.members,
    documentFolders: documentData.folders,
    documents: documentData.documents,
    messages,
    logs,
    canSendMessage: context.permissions.canSendMessage,
    canUploadDocuments: context.permissions.canUploadDocuments,
    canDeleteDocuments: context.permissions.canDeleteDocuments,
    canComplete: context.permissions.canChangeLifecycleStatus,
    lockedMessage: getLockedWorkOrderMessage(context.workOrder.status),
  };
}

export async function getMobileArchivedWorkOrderDetailsData(
  archivedWorkOrderId: string,
): Promise<MobileWorkOrderDetailsData | null> {
  const details = await getArchivedWorkOrderDetails(archivedWorkOrderId);

  if (!details) {
    return null;
  }

  return {
    space: {
      id: details.workOrder.spaceId,
      name: details.spaceName,
    },
    workOrder: details.workOrder,
    actorUserId: details.workOrder.ownerUserId,
    actorName: details.archivedByName,
    overview: details.overview,
    members: details.members,
    documentFolders: details.documentFolders,
    documents: details.documents,
    messages: details.messages,
    logs: details.logs,
    canSendMessage: false,
    canUploadDocuments: false,
    canDeleteDocuments: false,
    canComplete: false,
    lockedMessage: "Archived records are read-only and cannot be changed.",
    archivedMeta: {
      archivedWorkOrderId: details.archivedWorkOrderId,
      archivedAtLabel: details.archivedAtLabel,
      archivedByName: details.archivedByName,
      folderName: details.folderName,
    },
  };
}
