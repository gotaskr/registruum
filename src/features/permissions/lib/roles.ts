import type { SpaceMembershipRole } from "@/types/database";

export const spaceTeamRoles = [
  "admin",
  "operations_manager",
  "manager",
  "field_lead_superintendent",
] as const satisfies readonly SpaceMembershipRole[];

export const workOrderAssignmentRoles = [
  "officer_coordinator",
  "helper",
  "contractor",
  "worker",
] as const satisfies readonly SpaceMembershipRole[];

export const workOrderRoleOptions = [
  ...spaceTeamRoles,
  ...workOrderAssignmentRoles,
] as const satisfies readonly SpaceMembershipRole[];

export const editableWorkOrderAssignmentRoles = [
  "officer_coordinator",
  "helper",
  "contractor",
  "worker",
] as const satisfies readonly SpaceMembershipRole[];

const primarySpaceRoles = [
  "admin",
  "operations_manager",
  "manager",
] as const satisfies readonly SpaceMembershipRole[];

const protectedWorkOrderInheritedRoles = [
  "admin",
  "operations_manager",
  "manager",
  "field_lead_superintendent",
] as const satisfies readonly SpaceMembershipRole[];

export function isPrimarySpaceRole(
  role: SpaceMembershipRole | null | undefined,
): role is (typeof primarySpaceRoles)[number] {
  return role != null && (primarySpaceRoles as readonly string[]).includes(role);
}

export function isProtectedInheritedWorkOrderRole(
  role: SpaceMembershipRole | null | undefined,
): role is (typeof protectedWorkOrderInheritedRoles)[number] {
  return (
    role != null &&
    (protectedWorkOrderInheritedRoles as readonly string[]).includes(role)
  );
}

export function isSpaceTeamRole(
  role: SpaceMembershipRole | null | undefined,
): role is (typeof spaceTeamRoles)[number] {
  return role != null && (spaceTeamRoles as readonly string[]).includes(role);
}

export function isWorkOrderAssignmentRole(
  role: SpaceMembershipRole | null | undefined,
): role is (typeof workOrderAssignmentRoles)[number] {
  return role != null && (workOrderAssignmentRoles as readonly string[]).includes(role);
}

export function canAccessSpaceOverview(
  role: SpaceMembershipRole | null | undefined,
) {
  return isPrimarySpaceRole(role);
}

export function canSeeSpaceOnDashboard(
  role: SpaceMembershipRole | null | undefined,
) {
  return isPrimarySpaceRole(role) || role === "field_lead_superintendent";
}

export function canCreateSpaceTeamInvites(
  role: SpaceMembershipRole | null | undefined,
) {
  return role === "admin" || role === "operations_manager";
}

export function canAccessSpaceTeam(
  role: SpaceMembershipRole | null | undefined,
) {
  return isPrimarySpaceRole(role);
}

export function canAccessSpaceArchive(
  role: SpaceMembershipRole | null | undefined,
) {
  return isPrimarySpaceRole(role) || role === "field_lead_superintendent";
}

export function canAccessSpaceSettings(
  role: SpaceMembershipRole | null | undefined,
) {
  return isPrimarySpaceRole(role);
}

export function canRemoveSpaceTeamMember(
  actorRole: SpaceMembershipRole | null | undefined,
  targetRole: SpaceMembershipRole,
) {
  if (targetRole === "admin") {
    return false;
  }

  if (actorRole === "admin") {
    return true;
  }

  if (actorRole === "operations_manager") {
    return (
      targetRole === "manager" || targetRole === "field_lead_superintendent"
    );
  }

  if (actorRole === "manager") {
    return targetRole === "field_lead_superintendent";
  }

  return false;
}

export function canChangeSpaceTeamRole(
  actorRole: SpaceMembershipRole | null | undefined,
  targetRole: SpaceMembershipRole,
) {
  if (targetRole === "admin") {
    return false;
  }

  if (actorRole === "admin") {
    return true;
  }

  if (actorRole === "operations_manager") {
    return (
      targetRole === "manager" || targetRole === "field_lead_superintendent"
    );
  }

  return false;
}

export function getAssignableSpaceTeamRoles(
  actorRole: SpaceMembershipRole | null | undefined,
) {
  if (actorRole === "admin") {
    return [
      "operations_manager",
      "manager",
      "field_lead_superintendent",
    ] as const satisfies readonly SpaceMembershipRole[];
  }

  if (actorRole === "operations_manager") {
    return [
      "manager",
      "field_lead_superintendent",
    ] as const satisfies readonly SpaceMembershipRole[];
  }

  return [] as const satisfies readonly SpaceMembershipRole[];
}

export function getDefaultSpaceTeamInviteRole() {
  return "field_lead_superintendent" as const satisfies (typeof spaceTeamRoles)[number];
}

export function getDefaultWorkOrderInviteRole(): (typeof editableWorkOrderAssignmentRoles)[number] {
  return "worker";
}

export function canContractorAssignRole(
  role: SpaceMembershipRole,
) {
  return role === "worker";
}
