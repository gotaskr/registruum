import { workOrderRoleOptions } from "@/features/permissions/lib/roles";

export const editableWorkOrderRoles = workOrderRoleOptions;

export type EditableWorkOrderRole = (typeof editableWorkOrderRoles)[number];

export type WorkOrderPermissionDefinition = Readonly<{
  key:
    | "edit_work_order"
    | "change_work_order_status"
    | "archive_work_order"
    | "reopen_work_order"
    | "delete_work_order"
    | "invite_people"
    | "remove_people"
    | "change_member_roles"
    | "upload_files"
    | "delete_own_files"
    | "delete_any_files"
    | "download_files"
    | "send_messages"
    | "edit_own_messages"
    | "delete_own_messages"
    | "delete_any_message"
    | "view_logs"
    | "manage_work_order_settings"
    | "manage_permissions";
  label: string;
  isSensitive?: boolean;
  warning?: string;
}>;

export type WorkOrderPermissionGroup = Readonly<{
  key: "work_order" | "members" | "documents" | "chat" | "records";
  label: string;
  permissions: readonly WorkOrderPermissionDefinition[];
}>;

export const workOrderPermissionGroups: readonly WorkOrderPermissionGroup[] = [
  {
    key: "work_order",
    label: "Work Order",
    permissions: [
      {
        key: "edit_work_order",
        label: "Edit work order",
      },
      {
        key: "change_work_order_status",
        label: "Change work order status",
      },
      {
        key: "archive_work_order",
        label: "Archive work order",
      },
      {
        key: "reopen_work_order",
        label: "Reopen work order",
      },
      {
        key: "delete_work_order",
        label: "Delete work order",
        isSensitive: true,
        warning: "Deleting a work order permanently removes the record.",
      },
    ],
  },
  {
    key: "members",
    label: "Members",
    permissions: [
      {
        key: "invite_people",
        label: "Invite people",
      },
      {
        key: "remove_people",
        label: "Remove people",
        isSensitive: true,
        warning: "Removing people can immediately cut off access to the work order.",
      },
      {
        key: "change_member_roles",
        label: "Change member roles",
      },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    permissions: [
      {
        key: "upload_files",
        label: "Upload files",
      },
      {
        key: "delete_own_files",
        label: "Delete own files",
      },
      {
        key: "delete_any_files",
        label: "Delete any files",
      },
      {
        key: "download_files",
        label: "Download files",
      },
    ],
  },
  {
    key: "chat",
    label: "Chat",
    permissions: [
      {
        key: "send_messages",
        label: "Send messages",
      },
      {
        key: "edit_own_messages",
        label: "Edit own messages",
      },
      {
        key: "delete_own_messages",
        label: "Delete own messages",
      },
      {
        key: "delete_any_message",
        label: "Delete any message",
      },
    ],
  },
  {
    key: "records",
    label: "Records / Settings",
    permissions: [
      {
        key: "view_logs",
        label: "View logs",
      },
      {
        key: "manage_work_order_settings",
        label: "Manage work order settings",
      },
      {
        key: "manage_permissions",
        label: "Manage permissions",
        isSensitive: true,
        warning: "Managing permissions controls who can change settings, members, and records.",
      },
    ],
  },
] as const;

export type WorkOrderPermissionKey =
  (typeof workOrderPermissionGroups)[number]["permissions"][number]["key"];

export const allWorkOrderPermissionKeys = workOrderPermissionGroups.flatMap((group) =>
  group.permissions.map((permission) => permission.key),
) as WorkOrderPermissionKey[];

export type WorkOrderRolePermissionValues = Readonly<
  Record<WorkOrderPermissionKey, boolean>
>;

export type WorkOrderPermissionMatrix = Readonly<
  Record<EditableWorkOrderRole, WorkOrderRolePermissionValues>
>;

export function createPermissionValues(
  values: Partial<Record<WorkOrderPermissionKey, boolean>> = {},
): WorkOrderRolePermissionValues {
  const entries = allWorkOrderPermissionKeys.map((key) => [key, values[key] ?? false] as const);
  return Object.fromEntries(entries) as WorkOrderRolePermissionValues;
}

export function getDefaultWorkOrderPermissions(
  role: EditableWorkOrderRole,
): WorkOrderRolePermissionValues {
  switch (role) {
    case "admin":
      return createPermissionValues({
        edit_work_order: true,
        change_work_order_status: true,
        archive_work_order: true,
        reopen_work_order: true,
        delete_work_order: true,
        invite_people: true,
        remove_people: true,
        change_member_roles: true,
        upload_files: true,
        delete_own_files: true,
        delete_any_files: true,
        download_files: true,
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        delete_any_message: true,
        view_logs: true,
        manage_work_order_settings: true,
        manage_permissions: true,
      });
    case "operations_manager":
    case "manager":
      return createPermissionValues({
        edit_work_order: true,
        change_work_order_status: true,
        archive_work_order: true,
        reopen_work_order: true,
        delete_work_order: true,
        invite_people: true,
        remove_people: true,
        change_member_roles: true,
        upload_files: true,
        delete_own_files: true,
        delete_any_files: true,
        download_files: true,
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        delete_any_message: true,
        view_logs: true,
        manage_work_order_settings: true,
      });
    case "field_lead_superintendent":
      return createPermissionValues({
        edit_work_order: true,
        change_work_order_status: true,
        archive_work_order: true,
        reopen_work_order: true,
        delete_work_order: true,
        invite_people: true,
        remove_people: true,
        change_member_roles: true,
        upload_files: true,
        delete_own_files: true,
        delete_any_files: true,
        download_files: true,
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        delete_any_message: true,
        view_logs: true,
        manage_work_order_settings: true,
      });
    case "officer_coordinator":
      return createPermissionValues({
        download_files: true,
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        view_logs: true,
      });
    case "contractor":
      return createPermissionValues({
        invite_people: true,
        download_files: true,
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        view_logs: true,
      });
    case "helper":
    case "worker":
      return createPermissionValues({
        download_files: true,
        send_messages: true,
        edit_own_messages: true,
        delete_own_messages: true,
        view_logs: true,
      });
    default:
      return createPermissionValues();
  }
}

export function createDefaultWorkOrderPermissionMatrix(): WorkOrderPermissionMatrix {
  return {
    admin: getDefaultWorkOrderPermissions("admin"),
    operations_manager: getDefaultWorkOrderPermissions("operations_manager"),
    manager: getDefaultWorkOrderPermissions("manager"),
    officer_coordinator: getDefaultWorkOrderPermissions("officer_coordinator"),
    field_lead_superintendent: getDefaultWorkOrderPermissions("field_lead_superintendent"),
    helper: getDefaultWorkOrderPermissions("helper"),
    contractor: getDefaultWorkOrderPermissions("contractor"),
    worker: getDefaultWorkOrderPermissions("worker"),
  };
}
