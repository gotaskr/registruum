import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getArchiveFolderOptions } from "@/features/archive/api/archive";
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
  const [profile, spaces, space, workOrders, archiveFolderData] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getSpaceByIdForUser(spaceId),
    getWorkOrdersForSpace(spaceId),
    getArchiveFolderOptions(spaceId),
  ]);

  return (
    <AppShell
      spaces={spaces}
      profile={profile}
      space={space}
      workOrders={workOrders}
      archiveFolders={archiveFolderData.folders}
      defaultArchiveFolderId={archiveFolderData.defaultFolderId}
    >
      {children}
    </AppShell>
  );
}
