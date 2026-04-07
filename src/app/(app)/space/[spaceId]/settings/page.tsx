import { notFound } from "next/navigation";
import { canAccessSpaceSettings } from "@/features/permissions/lib/roles";
import { getSpaceByIdForUser } from "@/features/spaces/api/spaces";
import { SpaceSettingsScreen } from "@/features/spaces/ui/space-settings-screen";
import { getWorkOrdersForSpace } from "@/features/work-orders/api/work-orders";

type SpaceSettingsPageProps = Readonly<{
  params: Promise<{
    spaceId: string;
  }>;
}>;

export default async function SpaceSettingsPage({
  params,
}: SpaceSettingsPageProps) {
  const { spaceId } = await params;
  const [space, workOrders] = await Promise.all([
    getSpaceByIdForUser(spaceId),
    getWorkOrdersForSpace(spaceId),
  ]);

  if (!canAccessSpaceSettings(space.membershipRole)) {
    notFound();
  }

  return <SpaceSettingsScreen space={space} workOrders={workOrders} />;
}
