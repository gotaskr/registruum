"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  Eye,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus2,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MainShell } from "@/components/layout/main-shell";
import { RealtimeRouteRefresh } from "@/components/realtime/realtime-route-refresh";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { MemberRolePill } from "@/features/members/ui/member-list";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  canChangeSpaceTeamRole,
  canCreateSpaceTeamInvites,
  canRemoveSpaceTeamMember,
  getAssignableSpaceTeamRoles,
  isSpaceTeamRole,
} from "@/features/permissions/lib/roles";
import {
  createSpaceTeamInviteByUserTag,
  createSpaceTeamInviteLink,
} from "@/features/spaces/actions/space-team-invite.actions";
import { SpaceTeamRolesHelpModal } from "@/features/spaces/ui/space-team-roles-help-modal";
import {
  type SpaceTeamMemberActionState,
  removeSpaceTeamMember,
  updateSpaceTeamMemberRole,
} from "@/features/spaces/actions/space-team-member.actions";
import { initialInvitationActionState } from "@/features/settings/types/invitation-action-state";
import { formatRoleLabel } from "@/lib/utils";
import type { SpaceMembershipRole } from "@/types/database";
import type { Member } from "@/types/member";
import type { Space } from "@/types/space";

type SpaceTeamScreenProps = Readonly<{
  space: Space;
  members: Member[];
}>;

type InviteMethod = "link" | "code";

const initialSpaceTeamMemberActionState: SpaceTeamMemberActionState = {};

type InviteSpaceTeamModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  space: Space;
}>;

function InviteSpaceTeamModal({
  open,
  onClose,
  space,
}: InviteSpaceTeamModalProps) {
  const [method, setMethod] = useState<InviteMethod>("link");
  const [userTag, setUserTag] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkState, linkAction, linkPending] = useActionState(
    createSpaceTeamInviteLink,
    initialInvitationActionState,
  );
  const [tagState, tagAction, tagPending] = useActionState(
    createSpaceTeamInviteByUserTag,
    initialInvitationActionState,
  );

  const inviteLink = useMemo(() => {
    if (!linkState.inviteLink) {
      return "";
    }

    if (
      linkState.inviteLink.startsWith("http://") ||
      linkState.inviteLink.startsWith("https://")
    ) {
      return linkState.inviteLink;
    }

    const baseOrigin =
      typeof window === "undefined" ? "https://registruum.ca" : window.location.origin;
    return new URL(linkState.inviteLink, baseOrigin).toString();
  }, [linkState.inviteLink]);

  function handleClose() {
    setMethod("link");
    setUserTag("");
    setCopied(false);
    onClose();
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite to Space Team"
      description={`Add people to ${space.name} by sharing a link or using their user tag.`}
      panelClassName="max-w-2xl"
    >
      <div className="space-y-5 px-5 py-5">
        <div className="inline-flex rounded-2xl border border-border bg-panel-muted p-1">
          {([
            { value: "link", label: "Invite Link" },
            { value: "code", label: "User Tag" },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setMethod(option.value);
              }}
              className={[
                "rounded-[1rem] px-4 py-2 text-sm font-medium transition-colors",
                method === option.value
                  ? "bg-accent text-white shadow-[0_12px_24px_rgba(31,95,255,0.22)] dark:shadow-none"
                  : "text-muted hover:bg-panel hover:text-foreground",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
            Access Setup
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">
            Invite first, new team members join as Field Lead / Superintendent
          </p>
        </div>

        {method === "link" ? (
          <form action={linkAction} className="rounded-[1.7rem] border border-border bg-panel-muted p-4">
            <input type="hidden" name="spaceId" value={space.id} />
            <p className="text-sm font-medium text-foreground">Share invite link</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Send this link to a teammate so they can join this space team as a field lead / superintendent.
            </p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <div className="flex h-12 min-w-0 flex-1 items-center rounded-2xl border border-border bg-panel px-4 text-sm text-foreground">
                <span className="truncate">
                  {inviteLink || "Generate a space invite link"}
                </span>
              </div>
              {inviteLink ? (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy Link"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={linkPending}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-70 dark:shadow-none"
                >
                  {linkPending ? "Generating..." : "Generate Link"}
                </button>
              )}
            </div>
            <div className="mt-4">
              <FormMessage
                message={linkState.error ?? linkState.success}
                tone={linkState.error ? "error" : "info"}
              />
            </div>
          </form>
        ) : (
          <form action={tagAction} className="rounded-[1.7rem] border border-border bg-panel-muted p-4">
            <input type="hidden" name="spaceId" value={space.id} />
            <p className="text-sm font-medium text-foreground">Invite with user tag</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Ask the user for the user tag shown in their profile, then send a direct team invite as a field lead / superintendent.
            </p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-panel px-4">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <input
                  name="userTag"
                  value={userTag}
                  onChange={(event) =>
                    setUserTag(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^#A-Z0-9]/g, "")
                        .slice(0, 7),
                    )
                  }
                  placeholder="Enter user tag"
                  className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />
              </label>
              <button
                type="submit"
                disabled={tagPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none"
              >
                <UserPlus2 className="h-4 w-4" />
                {tagPending ? "Sending..." : "Send Invite"}
              </button>
            </div>
            <div className="mt-4">
              <FormMessage
                message={tagState.error ?? tagState.success}
                tone={tagState.error ? "error" : "info"}
              />
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

type TeamMemberCardProps = Readonly<{
  member: Member;
  spaceId: string;
  actorRole: SpaceMembershipRole | null | undefined;
}>;

function TeamMemberCard({
  member,
  spaceId,
  actorRole,
}: TeamMemberCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SpaceMembershipRole>(member.role);
  const [roleState, roleAction, rolePending] = useActionState(
    updateSpaceTeamMemberRole,
    initialSpaceTeamMemberActionState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeSpaceTeamMember,
    initialSpaceTeamMemberActionState,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canOpenProfile = member.role !== "admin";
  const canOpenRoleChange = canChangeSpaceTeamRole(actorRole, member.role);
  const canOpenRemove = canRemoveSpaceTeamMember(actorRole, member.role);
  const canShowMenu = canOpenProfile || canOpenRoleChange || canOpenRemove;
  const roleOptions = useMemo(
    () => [...getAssignableSpaceTeamRoles(actorRole)],
    [actorRole],
  );

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
    if (!roleState.success) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRoleModalOpen(false);
      setMenuOpen(false);
      router.refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [roleState.success, router]);

  useEffect(() => {
    if (!removeState.success) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRemoveModalOpen(false);
      setMenuOpen(false);
      router.refresh();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [removeState.success, router]);

  return (
    <>
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-panel px-2.5 py-2 sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-panel-muted text-xs font-semibold text-foreground sm:h-10 sm:w-10">
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
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">{member.name}</p>
          <p className="mt-0.5 truncate text-xs leading-tight text-muted">{member.email}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <MemberRolePill role={member.role} compact />
          {canShowMenu ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg border border-border bg-panel-muted text-muted transition-colors hover:bg-panel hover:text-foreground sm:h-9 sm:w-9"
                aria-label={`Open actions for ${member.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

                {menuOpen ? (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-44 rounded-xl border border-border bg-panel p-1.5 shadow-[0_16px_34px_rgba(15,23,42,0.08)] dark:shadow-none">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setSelectedRole(member.role);
                        setRoleModalOpen(true);
                      }}
                      disabled={!canOpenRoleChange}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-panel-muted"
                    >
                      <UserCog className="h-4 w-4" />
                      Change roles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-panel-muted"
                    >
                      <Eye className="h-4 w-4" />
                      View profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setRemoveModalOpen(true);
                      }}
                      disabled={!canOpenRemove}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change Team Role"
        description={`Update ${member.name}'s role inside this space.`}
        panelClassName="max-w-lg"
      >
        <form action={roleAction} className="space-y-4 px-5 py-5">
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="membershipId" value={member.id} />
          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
              Space Role
            </span>
            <select
              name="role"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as SpaceMembershipRole)}
              className="h-12 w-full rounded-2xl border border-border bg-panel px-4 text-sm text-foreground outline-none"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {formatRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <FormMessage
            message={roleState.error ?? roleState.success}
            tone={roleState.error ? "error" : "info"}
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setRoleModalOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-panel px-5 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canOpenRoleChange || rolePending}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] dark:shadow-none"
            >
              {rolePending ? "Saving..." : "Save Role"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Member Profile"
        description={`Team profile snapshot for ${member.name}.`}
        panelClassName="max-w-lg"
      >
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-4 rounded-[1.5rem] border border-border bg-panel-muted p-4">
            <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.3rem] border border-border bg-panel text-base font-semibold text-accent">
              {member.avatarUrl ? (
                <Image
                  src={member.avatarUrl}
                  alt={member.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                member.initials
              )}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-foreground">{member.name}</p>
              <p className="mt-1 text-sm text-muted">{member.email}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                Team Role
              </p>
              <p className="mt-3 text-sm font-medium text-foreground">
                {formatRoleLabel(member.role)}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-border bg-panel-muted px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                User Tag
              </p>
              <p className="mt-3 font-mono text-sm font-semibold tracking-[0.18em] text-foreground">
                {member.userTag ?? "Not available"}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        title="Remove Team Member"
        description={`Remove ${member.name} from this space team.`}
        panelClassName="max-w-lg"
      >
        <form action={removeAction} className="space-y-4 px-5 py-5">
          <input type="hidden" name="spaceId" value={spaceId} />
          <input type="hidden" name="membershipId" value={member.id} />
          <div className="rounded-[1.45rem] border border-border bg-panel-muted px-4 py-4 text-sm leading-6 text-muted">
            This removes their space-level access. Workorder-level membership can stay managed separately inside individual projects.
          </div>

          <FormMessage
            message={removeState.error ?? removeState.success}
            tone={removeState.error ? "error" : "info"}
          />

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setRemoveModalOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-panel px-5 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canOpenRemove || removePending}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(225,29,72,0.24)] dark:shadow-none"
            >
              {removePending ? "Removing..." : "Remove Member"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function SpaceTeamEmptyState({
  canInvite,
  onInvite,
}: Readonly<{
  canInvite: boolean;
  onInvite: () => void;
}>) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-panel-muted/40 px-4 py-8 text-center sm:rounded-2xl sm:py-10">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-panel text-muted">
        <UsersRound className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-foreground">No teammates yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        Invite people by shareable link or with their user tag from their profile.
      </p>
      {canInvite ? (
        <Button type="button" variant="brand" onClick={onInvite} className="mt-4 h-9 px-4 text-sm">
          <UserPlus2 className="mr-2 h-3.5 w-3.5" />
          Invite teammate
        </Button>
      ) : null}
    </div>
  );
}

export function SpaceTeamScreen({
  space,
  members,
}: SpaceTeamScreenProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [rolesHelpOpen, setRolesHelpOpen] = useState(false);
  const canInvite = canCreateSpaceTeamInvites(space.membershipRole);
  const teamMembers = useMemo(
    () => members.filter((member) => isSpaceTeamRole(member.role)),
    [members],
  );
  const showToolbarInvite = teamMembers.length > 0 || !canInvite;

  const body = (
    <>
      <RealtimeRouteRefresh
        channelName={`space:team:${space.id}`}
        subscriptions={[
          { table: "space_memberships", filter: `space_id=eq.${space.id}` },
          { table: "invites", filter: `space_id=eq.${space.id}` },
        ]}
      />
      <section className="px-3 pb-4 pt-2 sm:px-5 sm:pb-6 sm:pt-4 lg:px-8 lg:py-6">
        <InviteSpaceTeamModal
          open={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          space={space}
        />
        <SpaceTeamRolesHelpModal open={rolesHelpOpen} onClose={() => setRolesHelpOpen(false)} />

        <section className="rounded-xl border border-border bg-panel shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:rounded-2xl sm:shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3.5 lg:px-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  People in this space
                </h2>
                <button
                  type="button"
                  onClick={() => setRolesHelpOpen(true)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-panel-muted text-xs font-semibold text-muted transition-colors hover:border-slate-300 hover:bg-panel hover:text-foreground dark:hover:border-slate-600"
                  aria-label="What do space team roles mean?"
                  title="What do space team roles mean?"
                >
                  ?
                </button>
              </div>
              <p className="mt-0.5 hidden text-xs text-muted sm:block">
                Space teammates can access this organization. Work order assignments stay separate in each project.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
              <p className="text-xs text-muted">
                <span className="font-semibold text-foreground">{teamMembers.length}</span>
                <span className="font-medium"> teammate{teamMembers.length === 1 ? "" : "s"}</span>
              </p>
              {showToolbarInvite ? (
                <Button
                  type="button"
                  variant="brand"
                  disabled={!canInvite}
                  title={
                    !canInvite
                      ? "You do not have permission to invite people to this space."
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

          {!canInvite ? (
            <p className="border-b border-border px-3 py-2 text-xs leading-snug text-muted sm:px-4">
              You don&apos;t have permission to invite people to this space.
            </p>
          ) : null}

          <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-5">
            {teamMembers.length === 0 ? (
              <SpaceTeamEmptyState
                canInvite={canInvite}
                onInvite={() => setInviteModalOpen(true)}
              />
            ) : (
              <ul className="space-y-2" role="list">
                {teamMembers.map((member) => (
                  <li key={member.id}>
                    <TeamMemberCard
                      member={member}
                      spaceId={space.id}
                      actorRole={space.membershipRole}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </section>
    </>
  );

  return (
    <MainShell
      title="Team"
      description="Space-level teammates — separate from work order member assignments."
    >
      {body}
    </MainShell>
  );
}
