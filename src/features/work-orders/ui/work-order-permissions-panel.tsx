"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  allWorkOrderPermissionKeys,
  editableWorkOrderRoles,
  workOrderPermissionGroups,
  type EditableWorkOrderRole,
  type WorkOrderPermissionKey,
  type WorkOrderPermissionMatrix,
} from "@/features/permissions/lib/work-order-permission-definitions";
import { saveWorkOrderPermissions } from "@/features/work-orders/actions/work-order.actions";
import {
  initialWorkOrderActionState,
} from "@/features/work-orders/types/work-order-action-state";
import type { WorkOrder } from "@/types/work-order";

type WorkOrderPermissionsPanelProps = Readonly<{
  workOrder: WorkOrder;
  permissionMatrix: WorkOrderPermissionMatrix;
  canManagePermissions: boolean;
}>;

function createMutableMatrix(matrix: WorkOrderPermissionMatrix) {
  return {
    admin: { ...matrix.admin },
    manager: { ...matrix.manager },
    member: { ...matrix.member },
  };
}

export function WorkOrderPermissionsPanel({
  workOrder,
  permissionMatrix,
  canManagePermissions,
}: WorkOrderPermissionsPanelProps) {
  const [state, formAction, isPending] = useActionState(
    saveWorkOrderPermissions,
    initialWorkOrderActionState,
  );
  const [selectedRole, setSelectedRole] = useState<EditableWorkOrderRole>("admin");
  const [matrix, setMatrix] = useState(() => createMutableMatrix(permissionMatrix));

  const selectedPermissionValues = useMemo(
    () => matrix[selectedRole],
    [matrix, selectedRole],
  );

  const handleTogglePermission = (
    role: EditableWorkOrderRole,
    permissionKey: WorkOrderPermissionKey,
  ) => {
    if (!canManagePermissions) {
      return;
    }

    setMatrix((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [permissionKey]: !current[role][permissionKey],
      },
    }));
  };

  return (
    <section className="rounded-3xl border border-border bg-panel shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-border px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          Permissions
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Role permissions
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Review what each role can do inside this work order. Changes require an explicit save and are logged for audit review.
        </p>
      </div>

      <form action={formAction} className="space-y-5 px-6 py-6">
        <input type="hidden" name="spaceId" value={workOrder.spaceId} />
        <input type="hidden" name="workOrderId" value={workOrder.id} />

        {editableWorkOrderRoles.map((role) =>
          allWorkOrderPermissionKeys.map((permissionKey) => (
            <input
              key={`${role}:${permissionKey}`}
              type="hidden"
              name={`${role}:${permissionKey}`}
              value={matrix[role][permissionKey] ? "true" : "false"}
            />
          )),
        )}

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-panel-muted px-4 py-4">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Admin is the full-control role
            </p>
            <p className="mt-1 text-sm text-muted">
              Owner and admin are treated the same here. Use the Admin tab for full work order control.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-2xl border border-border bg-panel-muted p-1">
          {editableWorkOrderRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                selectedRole === role
                  ? "bg-slate-950 text-white"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {workOrderPermissionGroups.map((group) => (
            <section
              key={group.key}
              className="rounded-2xl border border-border bg-panel-muted/60 px-4 py-4"
            >
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">{group.label}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {group.permissions.map((permission) => (
                  <label
                    key={permission.key}
                    className={[
                      "rounded-2xl border px-4 py-3 transition-colors",
                      permission.isSensitive
                        ? "border-amber-200 bg-amber-50/70"
                        : "border-border bg-panel",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPermissionValues[permission.key]}
                        onChange={() =>
                          handleTogglePermission(selectedRole, permission.key)
                        }
                        disabled={!canManagePermissions || isPending}
                        className="mt-1 h-4 w-4 rounded-md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {permission.label}
                        </p>
                        {permission.warning ? (
                          <div className="mt-1 flex items-start gap-2 text-xs text-amber-700">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{permission.warning}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <FormMessage
          message={state.error ?? state.success}
          tone={state.error ? "error" : "info"}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={!canManagePermissions || isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </form>
    </section>
  );
}
