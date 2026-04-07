"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MoreHorizontal, UserCog, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  editableWorkOrderAssignmentRoles,
  isWorkOrderAssignmentRole,
} from "@/features/permissions/lib/roles";
import {
  removeWorkOrderMember,
  updateWorkOrderMemberRole,
} from "@/features/members/actions/member.actions";
import { initialWorkOrderMemberActionState } from "@/features/members/types/work-order-member-action-state";
import { formatRoleLabel } from "@/lib/utils";
import type { SpaceMembershipRole } from "@/types/database";

const roleOptions: SpaceMembershipRole[] = [...editableWorkOrderAssignmentRoles];

type WorkOrderMemberRowActionsProps = Readonly<{
  memberId: string;
  memberUserId: string;
  memberName: string;
  currentRole: SpaceMembershipRole;
  actorUserId: string;
  spaceId: string;
  workOrderId: string;
  canRemove: boolean;
  canChangeRole: boolean;
}>;

export function WorkOrderMemberRowActions({
  memberId,
  memberUserId,
  memberName,
  currentRole,
  actorUserId,
  spaceId,
  workOrderId,
  canRemove,
  canChangeRole,
}: WorkOrderMemberRowActionsProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SpaceMembershipRole>(currentRole);
  const [state, formAction, isPending] = useActionState(
    updateWorkOrderMemberRole,
    initialWorkOrderMemberActionState,
  );

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    setChangeRoleOpen(false);
    setMenuOpen(false);
    router.refresh();
  }, [router, state.success]);

  const canOpenChangeRole =
    canChangeRole && isWorkOrderAssignmentRole(currentRole) && memberUserId !== actorUserId;

  if (!canRemove && !canChangeRole) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-panel text-muted transition-colors hover:text-foreground"
          aria-label={`Open actions for ${memberName}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-11 z-20 min-w-40 rounded-xl border border-border bg-panel p-1 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            {canOpenChangeRole ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(currentRole);
                  setChangeRoleOpen(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-panel-muted"
              >
                <UserCog className="h-4 w-4" />
                Change Role
              </button>
            ) : null}

            {canRemove ? (
              <form action={removeWorkOrderMember}>
                <input type="hidden" name="spaceId" value={spaceId} />
                <input type="hidden" name="workOrderId" value={workOrderId} />
                <input type="hidden" name="membershipId" value={memberId} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>

      <Modal
        open={changeRoleOpen}
        onClose={() => setChangeRoleOpen(false)}
        title="Change Member Role"
        description={`Update ${memberName}'s role for this work order.`}
        panelClassName="max-w-lg"
      >
        <form action={formAction} className="space-y-4 px-5 py-4">
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="workOrderId" value={workOrderId} />
          <input type="hidden" name="membershipId" value={memberId} />
          <input type="hidden" name="memberUserId" value={memberUserId} />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Role</span>
            <select
              name="role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as SpaceMembershipRole)}
              className="h-11 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {formatRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <FormMessage
            message={state.error ?? state.success}
            tone={state.error ? "error" : "info"}
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setChangeRoleOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Role"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
