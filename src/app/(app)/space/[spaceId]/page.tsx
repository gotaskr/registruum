import { getSpaceByIdForUser } from "@/features/spaces/api/spaces";
import { SpaceWorkOrdersScreen } from "@/features/spaces/ui/space-work-orders-screen";
import { getWorkOrdersForSpace } from "@/features/work-orders/api/work-orders";

type SpacePageProps = Readonly<{
  params: Promise<{
    spaceId: string;
  }>;
}>;

export default async function SpacePage({ params }: SpacePageProps) {
  const { spaceId } = await params;
  const space = await getSpaceByIdForUser(spaceId);
  const workOrders = await getWorkOrdersForSpace(spaceId);

  return (
    <SpaceWorkOrdersScreen space={space} workOrders={workOrders} />
  );
}
