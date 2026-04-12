import { notFound } from "next/navigation";
import { canCreateWorkOrder } from "@/features/permissions/lib/work-order-permissions";
import { getSpaceMembersForSpace, getSpaceByIdForUser } from "@/features/spaces/api/spaces";
import { MobileCreateWorkOrderFlow } from "@/features/mobile/work-orders/ui/mobile-create-work-order-flow";

type MobileCreateWorkOrderPageProps = Readonly<{
  params: Promise<{
    spaceId: string;
  }>;
}>;

export default async function MobileCreateWorkOrderPage({
  params,
}: MobileCreateWorkOrderPageProps) {
  const { spaceId } = await params;
  const space = await getSpaceByIdForUser(spaceId);

  if (!canCreateWorkOrder(space.membershipRole ?? null)) {
    notFound();
  }

  const members = await getSpaceMembersForSpace(spaceId);

  return (
    <MobileCreateWorkOrderFlow
      spaceId={space.id}
      spaceName={space.name}
      members={members.map((member) => ({
        userId: member.userId,
        name: member.name,
        role: member.role,
      }))}
    />
  );
}
