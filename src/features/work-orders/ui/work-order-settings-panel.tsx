"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { ArchiveWorkOrderModal } from "@/features/archive/ui/archive-work-order-modal";
import { FormMessage } from "@/features/auth/ui/form-message";
import { splitWorkOrderDescription } from "@/features/work-orders/lib/work-order-description";
import {
  getWorkOrderSubjectTypeLabel,
  getWorkOrderSubjectTypePlaceholder,
  workOrderSubjectTypeOptions,
} from "@/features/work-orders/lib/work-order-subject-types";
import { updateWorkOrder } from "@/features/work-orders/actions/work-order.actions";
import {
  initialWorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";
import { WorkOrderPermissionsPanel } from "@/features/work-orders/ui/work-order-permissions-panel";
import type { WorkOrderMember } from "@/features/members/types/work-order-member";
import type { WorkOrderPermissionSet } from "@/features/permissions/lib/work-order-permissions";
import type { WorkOrderSettingsData } from "@/features/work-orders/types/work-order-settings";
import type { WorkOrder, WorkOrderSubjectType } from "@/types/work-order";

type WorkOrderSettingsPanelProps = Readonly<{
  workOrder: WorkOrder;
  members: WorkOrderMember[];
  settingsData?: WorkOrderSettingsData;
  permissions: WorkOrderPermissionSet;
}>;

function SettingsCard({
  eyebrow,
  title,
  description,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}>) {
  return (
    <section className="rounded-3xl border border-border bg-panel shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-border px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">{description}</p>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function SettingsToggle({
  name,
  label,
  description,
  defaultChecked,
  disabled,
}: Readonly<{
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  disabled?: boolean;
}>) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-panel-muted px-4 py-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 h-5 w-5 rounded-md"
      />
    </label>
  );
}

export function WorkOrderSettingsPanel({
  workOrder,
  members,
  settingsData,
  permissions,
}: WorkOrderSettingsPanelProps) {
  const [state, formAction, isPending] = useActionState(
    updateWorkOrder,
    initialWorkOrderActionState,
  );
  const details = splitWorkOrderDescription(
    workOrder.description,
    workOrder.subjectType,
    workOrder.subject,
  );
  const [subjectType, setSubjectType] = useState<WorkOrderSubjectType>(
    workOrder.subjectType ?? details.subjectType,
  );
  const ownerOptions = useMemo(() => {
    const currentOwnerExists = settingsData?.ownerOptions.some(
      (option) => option.id === workOrder.ownerUserId,
    );

    if (currentOwnerExists || !workOrder.ownerUserId) {
      return settingsData?.ownerOptions ?? [];
    }

    return [
      ...(settingsData?.ownerOptions ?? []),
      {
        id: workOrder.ownerUserId,
        name: "Current owner",
        email: null,
      },
    ];
  }, [settingsData?.ownerOptions, workOrder.ownerUserId]);

  const canEditStructuredSettings = permissions.canEditSettings;
  const canManageLifecycle =
    permissions.canChangeLifecycleStatus ||
    permissions.canArchiveWorkOrder ||
    permissions.canReopenWorkOrder;
  const canArchiveRecord =
    permissions.canArchiveWorkOrder &&
    workOrder.status !== "archived" &&
    Boolean(settingsData);
  const canSubmitSettings = canEditStructuredSettings || canManageLifecycle;
  const showProtectedEditReason =
    workOrder.status === "completed" || workOrder.status === "archived";
  const statusOptions = [
    { value: "open", label: "Draft" },
    { value: "in_progress", label: "In Progress" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
  ];
  const sectionItems = [
    { key: "overview", label: "Overview" },
    { key: "lifecycle", label: "Status & Lifecycle" },
    { key: "assignment", label: "Assignment" },
    { key: "documents", label: "Documents" },
    { key: "audit", label: "Audit & Logs" },
    { key: "permissions", label: "Permissions" },
  ] as const;
  const [selectedSection, setSelectedSection] = useState<
    (typeof sectionItems)[number]["key"]
  >("overview");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const showPrimarySave =
    selectedSection !== "permissions" && selectedSection !== "audit";

  return (
    <div className="space-y-6 px-6 py-6 lg:px-8">
      <section className="rounded-3xl border border-border bg-panel shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="border-b border-border px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
            Settings Sections
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Control panel
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Move through one settings area at a time so lifecycle, records, permissions, and audit controls stay easier to manage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-5">
          {sectionItems.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setSelectedSection(section.key)}
              className={[
                "rounded-2xl border px-4 py-2 text-sm font-medium transition-colors",
                selectedSection === section.key
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-border bg-panel-muted text-muted hover:text-foreground",
              ].join(" ")}
            >
              {section.label}
            </button>
          ))}
        </div>
      </section>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="workOrderId" value={workOrder.id} />
        <input type="hidden" name="spaceId" value={workOrder.spaceId} />
        <input
          type="hidden"
          name="isPostedToJobMarket"
          value={workOrder.isPostedToJobMarket ? "true" : "false"}
        />

        {!canEditStructuredSettings ? (
          <>
            <input type="hidden" name="title" value={workOrder.title} />
            <input type="hidden" name="subjectType" value={subjectType} />
            <input type="hidden" name="subject" value={workOrder.subject ?? details.subject} />
            <input
              type="hidden"
              name="locationLabel"
              value={workOrder.locationLabel ?? ""}
            />
            <input type="hidden" name="unitLabel" value={workOrder.unitLabel ?? ""} />
            <input
              type="hidden"
              name="description"
              value={details.description}
            />
            <input type="hidden" name="priority" value={workOrder.priority} />
            <input type="hidden" name="startDate" value={workOrder.startDate ?? ""} />
            <input
              type="hidden"
              name="dueDate"
              value={workOrder.dueDate ?? workOrder.expirationAt ?? ""}
            />
            <input type="hidden" name="ownerUserId" value={workOrder.ownerUserId} />
            <input type="hidden" name="vendorName" value={workOrder.vendorName ?? ""} />
            <input
              type="hidden"
              name="autoSaveChatAttachments"
              value={workOrder.autoSaveChatAttachments ? "true" : "false"}
            />
            <input
              type="hidden"
              name="allowDocumentDeletionInProgress"
              value={workOrder.allowDocumentDeletionInProgress ? "true" : "false"}
            />
            <input
              type="hidden"
              name="lockDocumentsOnCompleted"
              value={workOrder.lockDocumentsOnCompleted ? "true" : "false"}
            />
          </>
        ) : null}

        {!canManageLifecycle ? (
          <input type="hidden" name="status" value={workOrder.status} />
        ) : null}

        <FormMessage
          message={state.error ?? state.success}
          tone={state.error ? "error" : "info"}
        />

        <div className={selectedSection === "overview" ? "block" : "hidden"}>
          <SettingsCard
            eyebrow="Work Order Overview"
            title="Core record details"
            description="Update the title, type, location, and description used everywhere this work order appears."
          >
            <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Title</span>
              <input
                name="title"
                type="text"
                defaultValue={workOrder.title}
                disabled={!canEditStructuredSettings}
                className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              />
            </label>

            <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Type</span>
                <select
                  name="subjectType"
                  value={subjectType}
                  onChange={(event) => setSubjectType(event.target.value as WorkOrderSubjectType)}
                  disabled={!canEditStructuredSettings}
                  className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
                >
                  {workOrderSubjectTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">
                  {getWorkOrderSubjectTypeLabel(subjectType)}
                </span>
                <input
                  name="subject"
                  type="text"
                  defaultValue={workOrder.subject ?? details.subject}
                  disabled={!canEditStructuredSettings}
                  placeholder={getWorkOrderSubjectTypePlaceholder(subjectType)}
                  className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Location Label</span>
                <input
                  name="locationLabel"
                  type="text"
                  defaultValue={workOrder.locationLabel ?? ""}
                  disabled={!canEditStructuredSettings}
                  className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Unit Label</span>
                <input
                  name="unitLabel"
                  type="text"
                  defaultValue={workOrder.unitLabel ?? ""}
                  disabled={!canEditStructuredSettings}
                  className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <textarea
                name="description"
                rows={6}
                defaultValue={details.description}
                disabled={!canEditStructuredSettings}
                className="w-full rounded-2xl border border-border bg-panel px-3 py-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              />
            </label>
            </div>
          </SettingsCard>
        </div>

        <div className={selectedSection === "lifecycle" ? "block" : "hidden"}>
          <SettingsCard
            eyebrow="Status & Lifecycle"
            title="Lifecycle controls"
            description="Manage operational state, urgency, and timing while preserving record accountability."
          >
            <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Status</span>
              <select
                name="status"
                defaultValue={workOrder.status}
                disabled={!canManageLifecycle}
                className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              >
                {statusOptions.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Priority</span>
              <select
                name="priority"
                defaultValue={workOrder.priority}
                disabled={!canEditStructuredSettings}
                className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Start Date</span>
              <input
                name="startDate"
                type="date"
                defaultValue={workOrder.startDate ?? ""}
                disabled={!canEditStructuredSettings}
                className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Due Date</span>
              <input
                name="dueDate"
                type="date"
                defaultValue={workOrder.dueDate ?? workOrder.expirationAt ?? ""}
                disabled={!canEditStructuredSettings}
                className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              />
            </label>
            </div>

            {showProtectedEditReason ? (
              <label className="mt-5 block space-y-2">
                <span className="text-sm font-medium text-foreground">Reason for protected edit</span>
                <textarea
                  name="editReason"
                  rows={3}
                  required
                  disabled={!canSubmitSettings}
                  placeholder="Explain why this completed or archived work order is being changed."
                  className="w-full rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
                />
              </label>
            ) : (
              <input type="hidden" name="editReason" value="" />
            )}

            {canArchiveRecord ? (
              <div className="mt-5 rounded-2xl border border-border bg-panel-muted px-4 py-4">
                <p className="text-sm font-medium text-foreground">Archive finalization</p>
                <p className="mt-1 text-sm text-muted">
                  Archive stores this work order as a permanent read-only record in the global vault. Folder placement only changes organization and can be updated later.
                </p>
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
                >
                  Archive Work Order
                </button>
              </div>
            ) : null}
          </SettingsCard>
        </div>

        <div className={selectedSection === "assignment" ? "block" : "hidden"}>
          <SettingsCard
            eyebrow="Assignment"
            title="Ownership and team assignment"
            description="Owner controls the record, while assigned members are shown separately from broader work order access."
          >
            <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Owner</span>
              <select
                name="ownerUserId"
                defaultValue={workOrder.ownerUserId}
                disabled={!canEditStructuredSettings}
                className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              >
                {ownerOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {option.email ? ` / ${option.email}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Contractor / Vendor</span>
              <input
                name="vendorName"
                type="text"
                defaultValue={workOrder.vendorName ?? ""}
                disabled={!canEditStructuredSettings}
                placeholder="Optional contractor or vendor name"
                className="h-11 w-full rounded-2xl border border-border bg-panel px-3 text-sm text-foreground outline-none disabled:bg-panel-muted"
              />
            </label>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-panel-muted px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Assigned members</p>
                  <p className="mt-1 text-sm text-muted">
                    Member assignments are managed in the dedicated Members module.
                  </p>
                </div>
                <Link
                  href={`/space/${workOrder.spaceId}/work-order/${workOrder.id}/members`}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-panel px-4 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
                >
                  Manage members
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {members.length > 0 ? (
                  members.map((member) => (
                    <span
                      key={member.id}
                      className="inline-flex rounded-full border border-border bg-panel px-3 py-1.5 text-sm text-foreground"
                    >
                      {member.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted">No assigned members yet.</p>
                )}
              </div>
            </div>
          </SettingsCard>
        </div>

        <div className={selectedSection === "documents" ? "block" : "hidden"}>
          <SettingsCard
            eyebrow="Documents & Record Rules"
            title="Document behavior controls"
            description="Control how chat attachments behave, when files can be deleted, and when records lock down."
          >
            <div className="space-y-3">
            <SettingsToggle
              name="autoSaveChatAttachments"
              label="Auto-save chat attachments into Documents"
              description="Photos, videos, files, and links sent in chat will automatically appear in the Documents module."
              defaultChecked={workOrder.autoSaveChatAttachments}
              disabled={!canEditStructuredSettings}
            />
            <SettingsToggle
              name="allowDocumentDeletionInProgress"
              label="Allow deletion of files while work order is In Progress"
              description="Permitted users can delete files during active work, and every deletion is still logged."
              defaultChecked={workOrder.allowDocumentDeletionInProgress}
              disabled={!canEditStructuredSettings}
            />
            <SettingsToggle
              name="lockDocumentsOnCompleted"
              label="Lock documents when work order is Completed"
              description="Completed records become more protected unless an authorized user reopens the work order."
              defaultChecked={workOrder.lockDocumentsOnCompleted}
              disabled={!canEditStructuredSettings}
            />
            </div>

            <div className="mt-5">
              <span className="text-sm font-medium text-foreground">Add Photos</span>
              <div className="mt-2">
                <FileUploadField
                  name="photos"
                  buttonLabel="Upload Photos"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
                  helperText="You can add multiple photos. They will appear in the work order overview and documents."
                  disabled={!canEditStructuredSettings}
                />
              </div>
            </div>
          </SettingsCard>
        </div>

        <div className={selectedSection === "audit" ? "block" : "hidden"}>
          <SettingsCard
            eyebrow="Audit & Logs"
            title="Tracked record activity"
            description="Important operational actions are preserved so changes remain reviewable and accountable."
          >
            <div className="grid gap-3 md:grid-cols-2">
            {[
              "Permission changes",
              "Status changes",
              "Reopen and archive actions",
              "File deletions",
              "Settings edits",
              "Role changes",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-border bg-panel-muted px-4 py-3"
              >
                <ShieldCheck className="h-4 w-4 text-slate-700" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <p className="text-sm text-amber-800">
                Editing a completed or archived work order requires a reason and is always logged.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <Link
                href={`/space/${workOrder.spaceId}/work-order/${workOrder.id}/logs`}
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-panel px-4 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
              >
                Open Logs
              </Link>
            </div>
          </SettingsCard>
        </div>

        <div className={showPrimarySave ? "flex items-center justify-end" : "hidden"}>
          <button
            type="submit"
            suppressHydrationWarning
            disabled={!canSubmitSettings || isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {settingsData && selectedSection === "permissions" ? (
        <WorkOrderPermissionsPanel
          workOrder={workOrder}
          permissionMatrix={settingsData.permissionMatrix}
          canManagePermissions={permissions.canManagePermissions}
        />
      ) : null}

      {settingsData ? (
        <ArchiveWorkOrderModal
          open={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          workOrderId={workOrder.id}
          spaceId={workOrder.spaceId}
          workOrderTitle={workOrder.title}
          defaultFolderId={settingsData.defaultArchiveFolderId}
          folders={settingsData.archiveFolders}
        />
      ) : null}
    </div>
  );
}
