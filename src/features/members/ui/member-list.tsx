"use client";

import Image from "next/image";
import { useState } from "react";
import { Clock3, UserPlus2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkOrderInviteMemberModal } from "@/features/members/ui/work-order-invite-member-modal";
import { WorkOrderMemberRowActions } from "@/features/members/ui/work-order-member-row-actions";
import { WorkOrderRolesHelpModal } from "@/features/members/ui/work-order-roles-help-modal";
import { isWorkOrderAssignmentRole } from "@/features/permissions/lib/roles";
import { formatRoleLabel } from "@/lib/utils";
import type {
  WorkOrderMember,
  WorkOrderPendingInvite,
} from "@/features/members/types/work-order-member";
import type { SpaceMembershipRole } from "@/types/database";

type MemberListProps = Readonly<{
  members: WorkOrderMember[];
  pendingInvites: WorkOrderPendingInvite[];
  spaceId: string;
  workOrderId: string;
  canManageMembers: boolean;
  canInvitePeople: boolean;
  canChangeMemberRoles: boolean;
  canRemovePeople: boolean;
  actorRole: SpaceMembershipRole;
  actorUserId: string;
  lockedMessage?: string;
}>;

const roleClasses: Record<string, string> = {
  admin: "border-slate-300 bg-slate-100 text-slate-800",
  operations_manager: "border-sky-200 bg-sky-50 text-sky-800",
  manager: "border-slate-300 bg-slate-50 text-slate-700",
  officer_coordinator: "border-violet-200 bg-violet-50 text-violet-800",
  field_lead_superintendent: "border-emerald-200 bg-emerald-50 text-emerald-800",
  helper: "border-border bg-panel text-foreground",
  contractor: "border-amber-200 bg-amber-50 text-amber-800",
  worker: "border-border bg-panel-muted text-muted",
};

export function MemberRolePill({
  role,
  compact = false,
}: Readonly<{ role: WorkOrderMember["role"]; compact?: boolean }>) {
  return (
    <span
      className={[
        "inline-flex max-w-full items-center truncate rounded-full border font-medium",
        compact ? "px-2 py-0.5 text-[10px] sm:px-2.5 sm:text-[11px]" : "px-3 py-1 text-xs",
        roleClasses[role] ?? "border-border bg-panel text-foreground",
      ].join(" ")}
    >
      {formatRoleLabel(role)}
    </span>
  );
}

function MembersEmptyState({
  canManageMembers,
  canInvitePeople,
  lockedMessage,
  onInvite,
}: Readonly<{
  canManageMembers: boolean;
  canInvitePeople: boolean;
  lockedMessage?: string;
  onInvite: () => void;
}>) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-panel-muted/40 px-4 py-8 text-center sm:rounded-2xl sm:py-10">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-panel text-muted">
        <UsersRound className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-foreground">No members yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {canManageMembers
          ? "Invite someone to start the team list."
          : lockedMessage ?? "No members have been assigned to this work order yet."}
      </p>
      {canManageMembers && canInvitePeople ? (
        <Button
          type="button"
          variant="brand"
          onClick={onInvite}
          className="mt-4 h-9 px-4 text-sm"
        >
          <UserPlus2 className="mr-2 h-3.5 w-3.5" />
          Invite member
        </Button>
      ) : null}
    </div>
  );
}

function AssignedMemberRow({
  member,
  canChangeRole,
  canRemovePeople,
  actorRole,
  actorUserId,
  spaceId,
  workOrderId,
}: Readonly<{
  member: WorkOrderMember;
  canChangeRole: boolean;
  canRemovePeople: boolean;
  actorRole: SpaceMembershipRole;
  actorUserId: string;
  spaceId: string;
  workOrderId: string;
}>) {
  const canRemoveMember =
    canRemovePeople &&
    member.userId !== actorUserId &&
    actorRole !== "contractor" &&
    member.role !== "admin" &&
    member.role !== "operations_manager" &&
    member.role !== "manager";
  const showActionMenu = isWorkOrderAssignmentRole(member.role);

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-panel px-2.5 py-2 sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-panel-muted text-xs font-semibold text-foreground sm:h-10 sm:w-10">
        {member.avatarUrl ? (
          <Image
            src={member.avatarUrl}
            alt={member.name}
            width={40}
            height={40}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          member.initials
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">{member.name}</p>
        <p className="mt-0.5 truncate text-xs leading-tight text-slate-600 dark:text-slate-300">
          {member.email}
        </p>
        <p className="mt-1 hidden text-[11px] leading-tight text-slate-600 dark:text-slate-400 sm:block">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            Assigned {member.assignedAt}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <MemberRolePill role={member.role} compact />
        {showActionMenu ? (
          <WorkOrderMemberRowActions
            memberId={member.id}
            memberUserId={member.userId}
            memberName={member.name}
            currentRole={member.role}
            actorUserId={actorUserId}
            spaceId={spaceId}
            workOrderId={workOrderId}
            canRemove={canRemoveMember}
            canChangeRole={canChangeRole}
          />
        ) : null}
      </div>
    </div>
  );
}

export function MemberList({
  members,
  pendingInvites,
  spaceId,
  workOrderId,
  canManageMembers,
  canInvitePeople,
  canChangeMemberRoles,
  canRemovePeople,
  actorRole,
  actorUserId,
  lockedMessage,
}: MemberListProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [rolesHelpOpen, setRolesHelpOpen] = useState(false);
  const pendingCount = pendingInvites.length;
  const showToolbarInvite =
    members.length > 0 || !canInvitePeople || !canManageMembers;

  return (
    <section className="px-3 pb-4 pt-2 sm:px-5 sm:pb-6 sm:pt-4 lg:px-8 lg:py-6">
      <WorkOrderInviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        spaceId={spaceId}
        workOrderId={workOrderId}
      />
      <WorkOrderRolesHelpModal open={rolesHelpOpen} onClose={() => setRolesHelpOpen(false)} />

      <section className="rounded-xl border border-border bg-panel shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:rounded-2xl sm:shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3.5 lg:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                People on this work order
              </h2>
              <button
                type="button"
                onClick={() => setRolesHelpOpen(true)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-panel-muted text-xs font-semibold text-muted transition-colors hover:border-slate-300 hover:bg-panel hover:text-foreground dark:hover:border-slate-600"
                aria-label="What do work order assignment roles mean?"
                title="What do work order assignment roles mean?"
              >
                ?
              </button>
            </div>
            <p className="mt-0.5 hidden text-xs text-slate-600 dark:text-slate-300 sm:block">
              Everyone assigned can see this work order according to their role.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{members.length}</span>
              <span className="font-medium"> member{members.length === 1 ? "" : "s"}</span>
              {pendingCount > 0 ? (
                <>
                  <span className="mx-1.5 text-slate-400 dark:text-slate-500" aria-hidden>
                    ·
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{pendingCount}</span>
                  <span className="font-medium"> pending</span>
                </>
              ) : null}
            </p>
            {showToolbarInvite ? (
              <Button
                type="button"
                variant="brand"
                disabled={!canInvitePeople}
                title={
                  !canInvitePeople
                    ? (lockedMessage ?? "You cannot invite people with your current role.")
                    : "Invite by link or user tag"
                }
                onClick={() => setInviteModalOpen(true)}
                className="h-9 shrink-0 touch-manipulation px-3 text-xs font-medium sm:text-sm"
              >
                <UserPlus2 className="h-3.5 w-3.5 sm:mr-1.5" />
                Invite
              </Button>
            ) : null}
          </div>
        </div>

        {!canInvitePeople && lockedMessage ? (
          <p className="border-b border-border px-3 py-2 text-xs leading-snug text-muted sm:px-4">
            {lockedMessage}
          </p>
        ) : null}

        <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
          {members.length === 0 ? (
            <MembersEmptyState
              canManageMembers={canManageMembers}
              canInvitePeople={canInvitePeople}
              lockedMessage={lockedMessage}
              onInvite={() => setInviteModalOpen(true)}
            />
          ) : (
            <ul className="space-y-2" role="list">
              {members.map((member) => (
                <li key={member.id}>
                  <AssignedMemberRow
                    member={member}
                    canChangeRole={canChangeMemberRoles}
                    actorRole={actorRole}
                    actorUserId={actorUserId}
                    spaceId={spaceId}
                    workOrderId={workOrderId}
                    canRemovePeople={canRemovePeople}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </section>
  );
}
