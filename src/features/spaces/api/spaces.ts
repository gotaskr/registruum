import "server-only";

import { notFound } from "next/navigation";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  mapActivityLogRow,
  type ActivityLogProfile,
} from "@/features/logs/lib/log-entry";
import { profileAvatarBucket } from "@/features/settings/lib/profile-avatar-storage";
import { spacePhotoBucket } from "@/features/spaces/lib/space-photo-storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  canAccessSpaceOverview,
  canSeeSpaceOnDashboard,
  isSpaceTeamRole,
} from "@/features/permissions/lib/roles";
import { isMissingSpaceMembershipStatusColumn } from "@/lib/supabase/schema-compat";
import { getInitials } from "@/lib/utils";
import type { Database } from "@/types/database";
import type { LogEntry } from "@/types/log";
import type { Member } from "@/types/member";
import type { Space, SpaceType } from "@/types/space";

type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];
type SpaceMembershipRow = Database["public"]["Tables"]["space_memberships"]["Row"];
type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];
type WorkOrderMembershipRow =
  Database["public"]["Tables"]["work_order_memberships"]["Row"];
type ProfileSummaryRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "avatar_path" | "user_tag"
>;
type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

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

async function resolveSpacePhotoUrls(
  spaces: Pick<SpaceRow, "id" | "photo_path">[],
) {
  const adminSupabase = createSupabaseAdminClient();
  const photoEntries = await Promise.all(
    spaces.map(async (space) => {
      if (!space.photo_path) {
        return [space.id, null] as const;
      }

      const { data, error } = await adminSupabase.storage
        .from(spacePhotoBucket)
        .createSignedUrl(space.photo_path, 60 * 60);

      if (error || !data?.signedUrl) {
        return [space.id, null] as const;
      }

      return [space.id, data.signedUrl] as const;
    }),
  );

  return new Map(photoEntries);
}

function mapSpaceRow(
  row: SpaceRow,
  membershipRole: Member["role"] | undefined,
  canAccessOverview: boolean,
  landingWorkOrderId: string | null,
  photoUrl: string | null,
): Space {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    spaceType: row.space_type as SpaceType | null,
    photoPath: row.photo_path,
    photoFileName: row.photo_file_name,
    photoUrl,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    membershipRole,
    canAccessOverview,
    landingWorkOrderId,
  };
}

type AuthenticatedAppUser = Awaited<ReturnType<typeof requireAuthenticatedAppUser>>;

export async function getSpacesForUser(authenticated?: AuthenticatedAppUser) {
  const { supabase, user } = authenticated ?? (await requireAuthenticatedAppUser());
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
      .select("id, space_id, status")
      .in("id", assignedWorkOrderIds);

    if (assignedWorkOrdersError) {
      throw new Error(assignedWorkOrdersError.message);
    }

    const workOrderSpaceIdById = new Map(
      ((assignedWorkOrders ?? []) as Pick<
        WorkOrderRow,
        "id" | "space_id" | "status"
      >[])
        .filter((row) => row.status !== "archived")
        .map((row) => [row.id, row.space_id] as const),
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
  const photoUrlBySpaceId = await resolveSpacePhotoUrls(rows);

  return rows
    .map((space) => {
      const membershipRole = membershipRoleBySpaceId.get(space.id);
      const canAccessOverview = canAccessSpaceOverview(membershipRole);
      const landingWorkOrderId =
        canAccessOverview ? null : firstAssignedWorkOrderIdBySpaceId.get(space.id) ?? null;

      return mapSpaceRow(
        space,
        membershipRole,
        canAccessOverview,
        landingWorkOrderId,
        photoUrlBySpaceId.get(space.id) ?? null,
      );
    })
    .filter((space) =>
      canSeeSpaceOnDashboard(space.membershipRole) || Boolean(space.landingWorkOrderId),
    );
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

  return memberships
    .filter((membership) => isSpaceTeamRole(membership.role))
    .map((membership) => {
    const profile = profileById.get(membership.user_id);

    return {
      id: membership.id,
      spaceId: membership.space_id,
      userId: membership.user_id,
      name: profile?.full_name ?? "Unknown User",
      email: profile?.email ?? "unknown@registruum.app",
      userTag: profile?.user_tag ?? null,
      role: membership.role,
      initials: getInitials(profile?.full_name ?? "Unknown User"),
      avatarUrl: avatarUrlById.get(membership.user_id) ?? null,
    };
  });
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
    return rows.map((row) => mapActivityLogRow(row, new Map()));
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", actorIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const profiles = (profileRows ?? []) as ActivityLogProfile[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return rows.map((row) => mapActivityLogRow(row, profileById));
}
