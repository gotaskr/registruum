import type { SpaceMembershipRole, WorkOrderStatus } from "@/types/database";
import type { WorkOrderModule } from "@/types/work-order";
import {
  createDefaultWorkOrderPermissionMatrix,
  createPermissionValues,
  type EditableWorkOrderRole,
  type WorkOrderPermissionKey,
  type WorkOrderPermissionMatrix,
  type WorkOrderRolePermissionValues,
} from "@/features/permissions/lib/work-order-permission-definitions";

export type WorkOrderPermissionContext = Readonly<{
  role: SpaceMembershipRole | null;
  status: WorkOrderStatus;
  isOwner?: boolean;
  documentRules?: Readonly<{
    allowDocumentDeletionInProgress: boolean;
    lockDocumentsOnCompleted: boolean;
  }>;
  rolePermissionMatrix?: Partial<Record<EditableWorkOrderRole, Partial<Record<WorkOrderPermissionKey, boolean>>>>;
}>;

export type WorkOrderPermissionSet = Readonly<{
  canView: boolean;
  canCreateWorkOrder: boolean;
  canEditSettings: boolean;
  canDeleteWorkOrder: boolean;
  canChangeLifecycleStatus: boolean;
  canSendMessage: boolean;
  canCreateFolder: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  canDeleteOwnDocuments: boolean;
  canDeleteAnyDocuments: boolean;
  canManageMembers: boolean;
  canInvitePeople: boolean;
  canRemovePeople: boolean;
  canChangeMemberRoles: boolean;
  canManagePermissions: boolean;
  canViewLogs: boolean;
  canArchiveWorkOrder: boolean;
  canReopenWorkOrder: boolean;
  isCompleted: boolean;
  isArchived: boolean;
  isLocked: boolean;
  isOwner: boolean;
  resolvedRolePermissions: WorkOrderRolePermissionValues;
}>;

function getResolvedRolePermissions(
  role: SpaceMembershipRole | null,
  matrix: WorkOrderPermissionMatrix,
): WorkOrderRolePermissionValues {
  if (role === "admin") {
    return createDefaultWorkOrderPermissionMatrix().admin;
  }

  if (role === "manager") {
    return matrix.manager;
  }

  if (role === "member" || role === "contractor") {
    return matrix.member;
  }

  if (role === "viewer") {
    return createPermissionValues({
      download_files: true,
      view_logs: false,
    });
  }

  return createPermissionValues();
}

function resolvePermissionMatrix(
  input?: WorkOrderPermissionContext["rolePermissionMatrix"],
): WorkOrderPermissionMatrix {
  const defaults = createDefaultWorkOrderPermissionMatrix();

  if (!input) {
    return defaults;
  }

  return {
    admin: createPermissionValues({
      ...defaults.admin,
    }),
    manager: createPermissionValues({
      ...defaults.manager,
      ...input.manager,
    }),
    member: createPermissionValues({
      ...defaults.member,
      ...input.member,
    }),
  };
}

export function isLockedWorkOrder(status: WorkOrderStatus) {
  return status === "archived";
}

export function isProtectedWorkOrder(status: WorkOrderStatus) {
  return status === "completed" || status === "archived";
}

export function canCreateWorkOrder(role: SpaceMembershipRole | null) {
  return role === "admin";
}

export function canEditWorkOrder(
  role: SpaceMembershipRole | null,
  status: WorkOrderStatus,
) {
  if (status === "completed" || status === "archived") {
    return false;
  }

  return role === "admin" || role === "manager";
}

export function canDeleteWorkOrder(
  role: SpaceMembershipRole | null,
  status: WorkOrderStatus,
) {
  return role === "admin" && status !== "completed" && status !== "archived";
}

export function canAccessWorkOrder(role: SpaceMembershipRole | null) {
  return role !== null;
}

export function canChangeWorkOrderStatusTo(
  permissions: WorkOrderPermissionSet,
  currentStatus: WorkOrderStatus,
  nextStatus: WorkOrderStatus,
) {
  if (!permissions.canView) {
    return false;
  }

  if (currentStatus === "archived") {
    return false;
  }

  if (nextStatus === "archived") {
    return permissions.canArchiveWorkOrder;
  }

  if (currentStatus === "completed") {
    return permissions.canReopenWorkOrder;
  }

  if (nextStatus === "completed" || nextStatus === "open" || nextStatus === "in_progress" || nextStatus === "on_hold") {
    return permissions.canChangeLifecycleStatus;
  }

  return false;
}

export function getWorkOrderPermissionSet(
  context: WorkOrderPermissionContext,
): WorkOrderPermissionSet {
  const matrix = resolvePermissionMatrix(context.rolePermissionMatrix);
  const isOwner = Boolean(context.isOwner);
  const resolvedRolePermissions = isOwner
    ? createPermissionValues(
        Object.fromEntries(
          Object.keys(createDefaultWorkOrderPermissionMatrix().admin).map((key) => [key, true]),
        ) as Partial<Record<WorkOrderPermissionKey, boolean>>,
      )
    : getResolvedRolePermissions(context.role, matrix);
  const isArchived = context.status === "archived";
  const isCompleted = context.status === "completed";
  const documentsLocked =
    (isCompleted || isArchived) &&
    (context.documentRules?.lockDocumentsOnCompleted ?? true);
  const canDeleteDocumentInCurrentState =
    !documentsLocked &&
    (context.status !== "in_progress" ||
      context.documentRules?.allowDocumentDeletionInProgress !== false);
  const canInvitePeople =
    resolvedRolePermissions.invite_people && !isArchived && !isCompleted;
  const canRemovePeople =
    resolvedRolePermissions.remove_people && !isArchived && !isCompleted;
  const canChangeMemberRoles =
    resolvedRolePermissions.change_member_roles && !isArchived && !isCompleted;

  return {
    canView: canAccessWorkOrder(context.role),
    canCreateWorkOrder: canCreateWorkOrder(context.role),
    canEditSettings:
      resolvedRolePermissions.manage_work_order_settings && !isArchived && !isCompleted,
    canDeleteWorkOrder:
      resolvedRolePermissions.delete_work_order && !isArchived,
    canChangeLifecycleStatus:
      resolvedRolePermissions.change_work_order_status && !isArchived,
    canSendMessage:
      resolvedRolePermissions.send_messages && !isArchived && !isCompleted,
    canCreateFolder:
      resolvedRolePermissions.upload_files && !documentsLocked,
    canUploadDocuments:
      resolvedRolePermissions.upload_files && !documentsLocked,
    canDeleteDocuments:
      canDeleteDocumentInCurrentState &&
      (resolvedRolePermissions.delete_any_files ||
        resolvedRolePermissions.delete_own_files),
    canDeleteOwnDocuments:
      canDeleteDocumentInCurrentState &&
      resolvedRolePermissions.delete_own_files,
    canDeleteAnyDocuments:
      canDeleteDocumentInCurrentState &&
      resolvedRolePermissions.delete_any_files,
    canManageMembers:
      canInvitePeople || canRemovePeople || canChangeMemberRoles,
    canInvitePeople,
    canRemovePeople,
    canChangeMemberRoles,
    canManagePermissions:
      resolvedRolePermissions.manage_permissions && !isArchived && !isCompleted,
    canViewLogs: resolvedRolePermissions.view_logs,
    canArchiveWorkOrder:
      resolvedRolePermissions.archive_work_order && !isArchived,
    canReopenWorkOrder: resolvedRolePermissions.reopen_work_order && !isArchived,
    isCompleted,
    isArchived,
    isLocked: isArchived,
    isOwner,
    resolvedRolePermissions,
  };
}

export function getLockedWorkOrderMessage(status: WorkOrderStatus) {
  if (status === "archived") {
    return "This archived record is immutable and can only be reorganized from the Archive vault.";
  }

  if (status === "completed") {
    return "This work order is completed and locked. Reopen it before making changes.";
  }

  return undefined;
}

export function canAccessWorkOrderModule(
  module: WorkOrderModule,
  permissions: WorkOrderPermissionSet,
) {
  switch (module) {
    case "overview":
      return permissions.canView;
    case "chat":
      return permissions.canView;
    case "documents":
      return permissions.canView;
    case "members":
      return permissions.canView && permissions.canManageMembers;
    case "logs":
      return permissions.canViewLogs;
    case "settings":
      return permissions.canEditSettings || permissions.canManagePermissions;
    default:
      return false;
  }
}
