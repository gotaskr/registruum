import { workOrderAssignmentRoles } from "@/features/permissions/lib/roles";
import {
  getDefaultWorkOrderPermissions,
  type EditableWorkOrderRole,
  type WorkOrderPermissionKey,
} from "@/features/permissions/lib/work-order-permission-definitions";
import { formatRoleLabel } from "@/lib/utils";

const PERMISSION_PLAIN_ENGLISH: Record<WorkOrderPermissionKey, string> = {
  edit_work_order: "Edit the work order’s details (title, location, description, and similar fields).",
  change_work_order_status: "Move the work order between statuses, including marking it complete when the job is done.",
  archive_work_order: "Send a completed work order into the archive flow so it is stored with your archive records.",
  reopen_work_order: "Reopen a completed work order if more work is needed.",
  delete_work_order: "Delete the work order entirely (only while it is not completed or archived).",
  invite_people: "Invite others to join this work order.",
  remove_people: "Remove someone from this work order.",
  change_member_roles: "Change another person’s role on this work order.",
  upload_files: "Upload and organize documents and photos on this work order.",
  delete_own_files: "Delete files they uploaded themselves.",
  delete_any_files: "Delete any team member’s files on this work order.",
  download_files: "Download files that are attached here.",
  send_messages: "Post messages in the work order chat.",
  edit_own_messages: "Edit their own chat messages.",
  delete_own_messages: "Delete their own chat messages.",
  delete_any_message: "Delete anyone’s chat messages (moderation).",
  view_logs: "View the activity log and history for this work order.",
  manage_work_order_settings: "Open work order settings and adjust options like owner, priority, and document rules.",
  manage_permissions: "Change which roles can do what on this work order (permission matrix).",
};

/** Order used when listing what a role can do (roughly: work order → people → files → chat → records). */
const PERMISSION_ORDER: readonly WorkOrderPermissionKey[] = [
  "edit_work_order",
  "change_work_order_status",
  "archive_work_order",
  "reopen_work_order",
  "delete_work_order",
  "invite_people",
  "remove_people",
  "change_member_roles",
  "upload_files",
  "delete_own_files",
  "delete_any_files",
  "download_files",
  "send_messages",
  "edit_own_messages",
  "delete_own_messages",
  "delete_any_message",
  "view_logs",
  "manage_work_order_settings",
  "manage_permissions",
];

export type WorkOrderRoleHelpSummary = Readonly<{
  role: EditableWorkOrderRole;
  title: string;
  bullets: readonly string[];
}>;

/** Work-order assignment roles only (not space teammates such as Admin on the space team). */
export function getWorkOrderAssignmentRoleHelpSummaries(): readonly WorkOrderRoleHelpSummary[] {
  return workOrderAssignmentRoles.map((role) => {
    const permissions = getDefaultWorkOrderPermissions(role);
    const bullets = PERMISSION_ORDER.filter((key) => permissions[key]).map(
      (key) => PERMISSION_PLAIN_ENGLISH[key],
    );

    return {
      role,
      title: formatRoleLabel(role),
      bullets:
        bullets.length > 0
          ? bullets
          : ["No default permissions are enabled for this role in the standard setup."],
    };
  });
}
