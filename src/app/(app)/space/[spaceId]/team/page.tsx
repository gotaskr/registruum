import { notFound } from "next/navigation";
import { canAccessSpaceTeam } from "@/features/permissions/lib/roles";
import { getSpaceMembersForSpace, getSpaceByIdForUser } from "@/features/spaces/api/spaces";
import { SpaceTeamScreen } from "@/features/spaces/ui/space-team-screen";

type SpaceTeamPageProps = Readonly<{
  params: Promise<{
    spaceId: string;
  }>;
}>;

export default async function SpaceTeamPage({
  params,
}: SpaceTeamPageProps) {
  const { spaceId } = await params;
  const [space, members] = await Promise.all([
    getSpaceByIdForUser(spaceId),
    getSpaceMembersForSpace(spaceId),
  ]);

  if (!canAccessSpaceTeam(space.membershipRole)) {
    notFound();
  }

  return <SpaceTeamScreen space={space} members={members} />;
}
