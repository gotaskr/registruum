import { redirect } from "next/navigation";
import {
  getRecentActivityForSpace,
  getSpaceByIdForUser,
  getSpaceOverviewMembers,
} from "@/features/spaces/api/spaces";
import { SpaceOverview } from "@/features/spaces/ui/space-overview";
import { getWorkOrdersForSpace } from "@/features/work-orders/api/work-orders";
import { getWorkOrderModuleHref } from "@/lib/route-utils";

type SpacePageProps = Readonly<{
  params: Promise<{
    spaceId: string;
  }>;
}>;

export default async function SpacePage({ params }: SpacePageProps) {
  const { spaceId } = await params;
  const space = await getSpaceByIdForUser(spaceId);

  if (!space.canAccessOverview && space.landingWorkOrderId) {
    redirect(getWorkOrderModuleHref(space.id, space.landingWorkOrderId, "overview"));
  }

  const [recentActivity, workOrders, members] = await Promise.all([
    getRecentActivityForSpace(spaceId),
    getWorkOrdersForSpace(spaceId),
    getSpaceOverviewMembers(spaceId),
  ]);

  return (
    <SpaceOverview
      members={members}
      space={space}
      recentActivity={recentActivity}
      workOrders={workOrders}
    />
  );
}
