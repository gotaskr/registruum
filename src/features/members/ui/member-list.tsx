"use client";

import Image from "next/image";
import { useState } from "react";
import { Clock3, ShieldCheck, UserPlus2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkOrderInviteMemberModal } from "@/features/members/ui/work-order-invite-member-modal";
import { WorkOrderMemberRowActions } from "@/features/members/ui/work-order-member-row-actions";
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
  actorRole: SpaceMembershipRole;
  actorUserId: string;
  lockedMessage?: string;
}>;

const roleClasses: Record<string, string> = {
  admin: "border-slate-300 bg-slate-100 text-slate-800",
  manager: "border-slate-300 bg-slate-50 text-slate-700",
  contractor: "border-amber-200 bg-amber-50 text-amber-800",
  member: "border-border bg-panel text-foreground",
  viewer: "border-border bg-panel-muted text-muted",
};

function MemberRolePill({ role }: Readonly<{ role: WorkOrderMember["role"] }>) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        roleClasses[role] ?? "border-border bg-panel text-foreground",
      ].join(" ")}
    >
      {formatRoleLabel(role)}
    </span>
  );
}

function AssignMembersCard({
  spaceId,
  workOrderId,
  canManageMembers,
  membersCount,
  pendingInviteCount,
  lockedMessage,
}: Readonly<{
  spaceId: string;
  workOrderId: string;
  canManageMembers: boolean;
  membersCount: number;
  pendingInviteCount: number;
  lockedMessage?: string;
}>) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const helperText = !canManageMembers
    ? lockedMessage ?? "Only admins and managers can change members for this work order."
    : "Invite someone with a shareable link or add an existing Registruum user by their member code.";

  return (
    <section className="rounded-3xl border border-border bg-panel shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="border-b border-border px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          Members
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          Assign people to this work order
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{helperText}</p>
      </div>

      <div className="grid gap-4 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4">
          <p className="text-sm text-muted">
            New people can join this work order through an invite link. Existing users can be
            added immediately by member code.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => setInviteModalOpen(true)}
              disabled={!canManageMembers}
              className="h-11 rounded-2xl px-5"
            >
              <UserPlus2 className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Members
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {membersCount}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Pending
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {pendingInviteCount}
            </p>
          </div>
        </div>
      </div>

      <WorkOrderInviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        spaceId={spaceId}
        workOrderId={workOrderId}
      />
    </section>
  );
}

function MembersEmptyState({
  canManageMembers,
  lockedMessage,
}: Readonly<{
  canManageMembers: boolean;
  lockedMessage?: string;
}>) {
  return (
    <section className="rounded-3xl border border-dashed border-border bg-panel px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-muted text-muted">
        <UsersRound className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-foreground">No members assigned yet</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
        {canManageMembers
          ? "Invite someone to this work order to start building the team list."
          : lockedMessage ?? "No members have been assigned to this work order yet."}
      </p>
    </section>
  );
}

function AssignedMemberRow({
  member,
  canManageMembers,
  canChangeRole,
  actorRole,
  actorUserId,
  spaceId,
  workOrderId,
}: Readonly<{
  member: WorkOrderMember;
  canManageMembers: boolean;
  canChangeRole: boolean;
  actorRole: SpaceMembershipRole;
  actorUserId: string;
  spaceId: string;
  workOrderId: string;
}>) {
  const canRemoveMember =
    canManageMembers &&
    member.userId !== actorUserId &&
    (actorRole === "admin" || member.role !== "admin");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-panel-muted px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.03)] transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.06)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-panel text-sm font-semibold text-foreground">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.name}
              width={44}
              height={44}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            member.initials
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{member.name}</p>
          <p className="mt-1 truncate text-sm text-muted">{member.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {formatRoleLabel(member.role)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              Assigned {member.assignedAt}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-start lg:self-center">
        <MemberRolePill role={member.role} />
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
  actorRole,
  actorUserId,
  lockedMessage,
}: MemberListProps) {
  return (
    <section className="space-y-6 px-6 py-6 lg:px-8">
      <AssignMembersCard
        spaceId={spaceId}
        workOrderId={workOrderId}
        canManageMembers={canManageMembers}
        membersCount={members.length}
        pendingInviteCount={pendingInvites.length}
        lockedMessage={lockedMessage}
      />

      <section className="rounded-3xl border border-border bg-panel shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                Members List
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                People currently on this work order
              </h2>
              <p className="mt-2 text-sm text-muted">
                Keep the team list clear and focused so everyone knows who belongs here.
              </p>
            </div>
            <span className="inline-flex rounded-full border border-border bg-panel-muted px-3 py-1.5 text-sm font-medium text-foreground">
              {members.length} assigned
            </span>
          </div>
        </div>

        <div className="px-6 py-6">
          {members.length === 0 ? (
            <MembersEmptyState
              canManageMembers={canManageMembers}
              lockedMessage={lockedMessage}
            />
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <AssignedMemberRow
                  key={member.id}
                  member={member}
                  canManageMembers={canManageMembers}
                  canChangeRole={actorRole === "admin"}
                  actorRole={actorRole}
                  actorUserId={actorUserId}
                  spaceId={spaceId}
                  workOrderId={workOrderId}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
