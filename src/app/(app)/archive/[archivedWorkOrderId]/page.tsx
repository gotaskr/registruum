import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import {
  getArchivedWorkOrderDetails,
  getArchivePageData,
} from "@/features/archive/api/archive";
import { ArchiveRecordBottomNav } from "@/features/archive/ui/archive-record-bottom-nav";
import { ArchiveRecordDetailView } from "@/features/archive/ui/archive-record-detail-view";
import { ArchiveSidebar } from "@/features/archive/ui/archive-sidebar";
import { getSpacesForUser } from "@/features/spaces/api/spaces";

type ArchiveRecordPageProps = Readonly<{
  params: Promise<{
    archivedWorkOrderId: string;
  }>;
}>;

export default async function ArchiveRecordPage({
  params,
}: ArchiveRecordPageProps) {
  const { archivedWorkOrderId } = await params;
  const [profile, spaces, details] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getArchivedWorkOrderDetails(archivedWorkOrderId),
  ]);

  if (!details) {
    notFound();
  }

  const archiveData = await getArchivePageData({
    spaceId: details.spaceId,
    folderId: details.folderId,
  });

  return (
    <DashboardShell
      activeView="archive"
      spaces={spaces}
      profile={profile}
      sidebar={
        <ArchiveSidebar
          folders={archiveData.folders}
          selectedFolderId={details.folderId}
          defaultFolderId={archiveData.defaultFolderId}
          basePath="/archive"
          selectedSpaceId={details.spaceId}
          allArchiveCount={archiveData.totalCount}
        />
      }
      mobileBottomNav={
        <Suspense fallback={null}>
          <ArchiveRecordBottomNav
            archivedWorkOrderId={archivedWorkOrderId}
            spaceId={details.spaceId}
            folderId={details.folderId}
          />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <ArchiveRecordDetailView details={details} />
      </Suspense>
    </DashboardShell>
  );
}
