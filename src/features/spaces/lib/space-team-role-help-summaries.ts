import { spaceTeamRoles } from "@/features/permissions/lib/roles";
import { formatRoleLabel } from "@/lib/utils";

export type SpaceTeamRoleHelpSummary = Readonly<{
  role: (typeof spaceTeamRoles)[number];
  title: string;
  bullets: readonly string[];
}>;

const SPACE_TEAM_ROLE_BULLETS: Record<
  (typeof spaceTeamRoles)[number],
  readonly string[]
> = {
  admin: [
    "Highest level of control for this space: open the space overview, manage this team list, change space settings, and use archive tools where your account allows.",
    "Can invite new people to the space team (they usually join as Field Lead / Superintendent until someone changes their role).",
    "Can remove teammates and update their roles. Another Admin’s role cannot be changed from this screen.",
  ],
  operations_manager: [
    "Senior operator for the space with access to the overview, this team list, space settings, and archive in line with your organization’s rules.",
    "Can invite people to the space team using a share link or user tag.",
    "Can remove Managers and Field Leads / Superintendents from the team and can change those people’s roles.",
  ],
  manager: [
    "Helps run the space day to day with access to the overview, this team list, space settings, and archive where permitted.",
    "Cannot start new space invites — only Admins and Operations Managers can create invite links or tag-invites.",
    "Can remove Field Leads / Superintendents from the space team. Changing teammate roles on this page is reserved for Admins and Operations Managers.",
  ],
  field_lead_superintendent: [
    "Site leadership role on the space team: they can appear on your dashboard and use archive-related access when your setup allows it.",
    "They do not open this Team management page themselves — only Admins, Operations Managers, and Managers can manage the roster here.",
    "Putting them on specific jobs is done separately by adding them to each work order’s member list.",
  ],
};

export function getSpaceTeamRoleHelpSummaries(): readonly SpaceTeamRoleHelpSummary[] {
  return spaceTeamRoles.map((role) => ({
    role,
    title: formatRoleLabel(role),
    bullets: SPACE_TEAM_ROLE_BULLETS[role],
  }));
}
