import "server-only";

import { notFound } from "next/navigation";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { parseLogDetails } from "@/features/logs/lib/log-details";
import { profileAvatarBucket } from "@/features/settings/lib/profile-avatar-storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
import { formatDateTimeLabel, getInitials } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { LogEntry } from "@/types/log";
import type { Member } from "@/types/member";
import type { Space } from "@/types/space";
import type { SpaceOverviewMember } from "@/features/spaces/types/space-overview";

type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];
type SpaceMembershipRow = Database["public"]["Tables"]["space_memberships"]["Row"];
type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];
type WorkOrderMembershipRow =
  Database["public"]["Tables"]["work_order_memberships"]["Row"];
type ProfileSummaryRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "avatar_path"
>;
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];
type ProfileNameRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name"
>;

async function resolveAvatarUrls(
  profiles: ProfileSummaryRow[],
) {
  const adminSupabase = createSupabaseAdminClient();
  const avatarEntries = await Promise.all(
    profiles.map(async (profile) => {
      if (!profile.avatar_path) {
        return [profile.id, null] as const;
      }

      const { data, error } = await adminSupabase.storage
        .from(profileAvatarBucket)
        .createSignedUrl(profile.avatar_path, 60 * 60);

      if (error || !data?.signedUrl) {
        return [profile.id, null] as const;
      }

      return [profile.id, data.signedUrl] as const;
    }),
  );

  return new Map(avatarEntries);
}

function mapSpaceRow(
  row: SpaceRow,
  membershipRole: Member["role"] | undefined,
  canAccessOverview: boolean,
  landingWorkOrderId: string | null,
): Space {
  return {
    id: row.id,
    name: row.name,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    membershipRole,
    canAccessOverview,
    landingWorkOrderId,
  };
}

export async function getSpacesForUser() {
  const { supabase, user } = await requireAuthenticatedAppUser();
  let membershipQuery = await supabase
    .from("space_memberships")
    .select("space_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (isMissingSpaceMembershipStatusColumn(membershipQuery.error)) {
    membershipQuery = await supabase
      .from("space_memberships")
      .select("space_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
  }

  const { data: membershipRows, error: membershipError } = membershipQuery;

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const memberships = (membershipRows ?? []) as SpaceMembershipRow[];

  if (memberships.length === 0) {
    return [];
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("work_order_memberships")
    .select("work_order_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const spaceIds = memberships.map((row) => row.space_id);
  const membershipRoleBySpaceId = new Map(
    memberships.map((row) => [row.space_id, row.role] as const),
  );
  const assignedWorkOrderIds = [
    ...new Set(
      ((assignmentRows ?? []) as Pick<
        WorkOrderMembershipRow,
        "work_order_id" | "created_at"
      >[]).map((row) => row.work_order_id),
    ),
  ];
  const firstAssignedWorkOrderIdBySpaceId = new Map<string, string>();

  if (assignedWorkOrderIds.length > 0) {
    const { data: assignedWorkOrders, error: assignedWorkOrdersError } = await supabase
      .from("work_orders")
      .select("id, space_id")
      .in("id", assignedWorkOrderIds);

    if (assignedWorkOrdersError) {
      throw new Error(assignedWorkOrdersError.message);
    }

    const workOrderSpaceIdById = new Map(
      ((assignedWorkOrders ?? []) as Pick<WorkOrderRow, "id" | "space_id">[]).map((row) => [
        row.id,
        row.space_id,
      ]),
    );

    for (const assignment of (assignmentRows ?? []) as Pick<
      WorkOrderMembershipRow,
      "work_order_id" | "created_at"
    >[]) {
      const assignmentSpaceId = workOrderSpaceIdById.get(assignment.work_order_id);

      if (!assignmentSpaceId || firstAssignedWorkOrderIdBySpaceId.has(assignmentSpaceId)) {
        continue;
      }

      firstAssignedWorkOrderIdBySpaceId.set(
        assignmentSpaceId,
        assignment.work_order_id,
      );
    }
  }

  const { data: spaceRows, error: spaceError } = await supabase
    .from("spaces")
    .select("*")
    .in("id", spaceIds)
    .order("created_at", { ascending: true });

  if (spaceError) {
    throw new Error(spaceError.message);
  }

  const rows = (spaceRows ?? []) as SpaceRow[];

  return rows
    .map((space) => {
      const membershipRole = membershipRoleBySpaceId.get(space.id);
      const canAccessOverview = membershipRole === "admin";
      const landingWorkOrderId =
        canAccessOverview ? null : firstAssignedWorkOrderIdBySpaceId.get(space.id) ?? null;

      return mapSpaceRow(
        space,
        membershipRole,
        canAccessOverview,
        landingWorkOrderId,
      );
    })
    .filter((space) => space.canAccessOverview || Boolean(space.landingWorkOrderId));
}

export async function getSpaceByIdForUser(spaceId: string) {
  const spaces = await getSpacesForUser();
  const space = spaces.find((candidate) => candidate.id === spaceId);

  if (!space) {
    notFound();
  }

  return space;
}

export async function getInitialSpaceForUser() {
  const spaces = await getSpacesForUser();
  return spaces[0] ?? null;
}

export async function getSpaceMembersForSpace(spaceId: string) {
  const { supabase } = await requireAuthenticatedAppUser();
  const adminSupabase = createSupabaseAdminClient();

  await getSpaceByIdForUser(spaceId);

  let membershipQuery = await supabase
    .from("space_memberships")
    .select("id, space_id, user_id, role, created_at")
    .eq("space_id", spaceId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (isMissingSpaceMembershipStatusColumn(membershipQuery.error)) {
    membershipQuery = await supabase
      .from("space_memberships")
      .select("id, space_id, user_id, role, created_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });
  }

  const { data: membershipRows, error: membershipError } = membershipQuery;

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const memberships = (membershipRows ?? []) as SpaceMembershipRow[];

  if (memberships.length === 0) {
    return [];
  }

  const userIds = memberships.map((row) => row.user_id);
  const { data: profileRows, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, avatar_path")
    .in("id", userIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileRows ?? []) as ProfileSummaryRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const avatarUrlById = await resolveAvatarUrls(profiles);

  return memberships.map((membership) => {
    const profile = profileById.get(membership.user_id);

    return {
      id: membership.id,
      spaceId: membership.space_id,
      userId: membership.user_id,
      name: profile?.full_name ?? "Unknown User",
      email: profile?.email ?? "unknown@registruum.app",
      role: membership.role,
      initials: getInitials(profile?.full_name ?? "Unknown User"),
      avatarUrl: avatarUrlById.get(membership.user_id) ?? null,
    };
  });
}

export async function getSpaceOverviewMembers(
  spaceId: string,
): Promise<SpaceOverviewMember[]> {
  const { supabase, user } = await requireAuthenticatedAppUser();
  const adminSupabase = createSupabaseAdminClient();
  const membership = await getSpaceByIdForUser(spaceId);
  const { count: workOrderCount, error: workOrderCountError } = await supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("space_id", spaceId);

  if (workOrderCountError) {
    throw new Error(workOrderCountError.message);
  }

  let membershipQuery = await supabase
    .from("space_memberships")
    .select("id, space_id, user_id, role, created_at")
    .eq("space_id", spaceId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (isMissingSpaceMembershipStatusColumn(membershipQuery.error)) {
    membershipQuery = await supabase
      .from("space_memberships")
      .select("id, space_id, user_id, role, created_at")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });
  }

  const { data: membershipRows, error: membershipError } = membershipQuery;

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const memberships = (membershipRows ?? []) as SpaceMembershipRow[];

  if (memberships.length === 0) {
    return [];
  }

  const userIds = memberships.map((row) => row.user_id);
  const { data: profileRows, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, avatar_path")
    .in("id", userIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileRows ?? []) as ProfileSummaryRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const avatarUrlById = await resolveAvatarUrls(profiles);
  const shouldOnlyShowOwner = (workOrderCount ?? 0) === 0;
  let visibleWorkOrderRows: Pick<WorkOrderRow, "id" | "title">[] = [];

  if (!shouldOnlyShowOwner && membership.membershipRole === "admin") {
    const { data: workOrderRows, error: workOrderError } = await supabase
      .from("work_orders")
      .select("id, title")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false });

    if (workOrderError) {
      throw new Error(workOrderError.message);
    }

    visibleWorkOrderRows = (workOrderRows ?? []) as Pick<WorkOrderRow, "id" | "title">[];
  } else {
    const { data: visibleAssignmentRows, error: visibleAssignmentError } = await supabase
      .from("work_order_memberships")
      .select("work_order_id")
      .eq("user_id", user.id);

    if (visibleAssignmentError) {
      throw new Error(visibleAssignmentError.message);
    }

    const visibleWorkOrderIds = [
      ...new Set(
        ((visibleAssignmentRows ?? []) as Pick<
          WorkOrderMembershipRow,
          "work_order_id"
        >[]).map((row) => row.work_order_id),
      ),
    ];

    if (visibleWorkOrderIds.length > 0) {
      const { data: workOrderRows, error: workOrderError } = await supabase
        .from("work_orders")
        .select("id, title")
        .eq("space_id", spaceId)
        .in("id", visibleWorkOrderIds)
        .order("created_at", { ascending: false });

      if (workOrderError) {
        throw new Error(workOrderError.message);
      }

      visibleWorkOrderRows = (workOrderRows ?? []) as Pick<
        WorkOrderRow,
        "id" | "title"
      >[];
    }
  }

  const visibleWorkOrderIds = visibleWorkOrderRows.map((row) => row.id);
  const workOrderTitleById = new Map(
    visibleWorkOrderRows.map((workOrder) => [workOrder.id, workOrder.title] as const),
  );

  const memberWorkOrdersByUserId = new Map<string, string[]>();

  if (visibleWorkOrderIds.length > 0) {
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from("work_order_memberships")
      .select("user_id, work_order_id")
      .in("user_id", userIds)
      .in("work_order_id", visibleWorkOrderIds);

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }

    for (const assignment of (assignmentRows ?? []) as Pick<
      WorkOrderMembershipRow,
      "user_id" | "work_order_id"
    >[]) {
      const currentTitles = memberWorkOrdersByUserId.get(assignment.user_id) ?? [];
      const workOrderTitle = workOrderTitleById.get(assignment.work_order_id);

      if (workOrderTitle) {
        currentTitles.push(workOrderTitle);
        memberWorkOrdersByUserId.set(assignment.user_id, currentTitles);
      }
    }
  }

  return memberships.map((spaceMembership) => {
    const profile = profileById.get(spaceMembership.user_id);

    return {
      id: spaceMembership.id,
      spaceId: spaceMembership.space_id,
      userId: spaceMembership.user_id,
      name: profile?.full_name ?? "Unknown User",
      email: profile?.email ?? "unknown@registruum.app",
      role: spaceMembership.role,
      initials: getInitials(profile?.full_name ?? "Unknown User"),
      avatarUrl: avatarUrlById.get(spaceMembership.user_id) ?? null,
      workOrderTitles: memberWorkOrdersByUserId.get(spaceMembership.user_id) ?? [],
    };
  }).filter((member) =>
    shouldOnlyShowOwner ? member.userId === membership.createdByUserId : true,
  );
}

export async function getRecentActivityForSpace(
  spaceId: string,
  limit = 5,
): Promise<LogEntry[]> {
  const { supabase } = await requireAuthenticatedAppUser();
  const space = await getSpaceByIdForUser(spaceId);

  if (!space.canAccessOverview) {
    notFound();
  }

  const { data: logRows, error: logError } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (logError) {
    throw new Error(logError.message);
  }

  const rows = (logRows ?? []) as ActivityLogRow[];
  const actorIds = [
    ...new Set(
      rows
        .map((row) => row.actor_user_id)
        .filter((value): value is string => value !== null),
    ),
  ];

  if (actorIds.length === 0) {
    return rows.map((row) => {
      const details = parseLogDetails(row.details);
      return {
      id: row.id,
      workOrderId: row.work_order_id ?? "",
      actorUserId: row.actor_user_id,
      actorName: "System",
      action: row.action,
      createdAt: formatDateTimeLabel(row.created_at),
      rawCreatedAt: row.created_at,
      details: details.summary,
      change:
        details.before || details.after
          ? {
              before: details.before,
              after: details.after,
            }
          : undefined,
    };});
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", actorIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileRows ?? []) as ProfileNameRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const details = parseLogDetails(row.details);
    return {
    id: row.id,
    workOrderId: row.work_order_id ?? "",
    actorUserId: row.actor_user_id,
    actorName: row.actor_user_id
      ? (profileById.get(row.actor_user_id)?.full_name ?? "Unknown User")
      : "System",
    action: row.action,
    createdAt: formatDateTimeLabel(row.created_at),
    rawCreatedAt: row.created_at,
    details: details.summary,
    change:
      details.before || details.after
        ? {
            before: details.before,
            after: details.after,
          }
        : undefined,
  };});
}
