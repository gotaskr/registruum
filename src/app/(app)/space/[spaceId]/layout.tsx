import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getSpaceByIdForUser, getSpacesForUser } from "@/features/spaces/api/spaces";
import { getWorkOrdersForSpace } from "@/features/work-orders/api/work-orders";

type SpaceLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{
    spaceId: string;
  }>;
}>;

export default async function SpaceLayout({
  children,
  params,
}: SpaceLayoutProps) {
  const { spaceId } = await params;
  const [profile, spaces, space, workOrders] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getSpaceByIdForUser(spaceId),
    getWorkOrdersForSpace(spaceId),
  ]);

  return (
    <AppShell
      profile={profile}
      spaces={spaces}
      space={space}
      workOrders={workOrders}
    >
      {children}
    </AppShell>
  );
}
