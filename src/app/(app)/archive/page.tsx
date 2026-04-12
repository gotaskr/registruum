import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getArchivePageData } from "@/features/archive/api/archive";
import { ArchiveDashboard } from "@/features/archive/ui/archive-dashboard";
import { ArchiveSidebar } from "@/features/archive/ui/archive-sidebar";
import { getSpacesForUser } from "@/features/spaces/api/spaces";

type ArchivePageProps = Readonly<{
  searchParams?: Promise<{
    folder?: string;
    space?: string;
    query?: string;
    sort?: string;
  }>;
}>;

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const [profile, spaces, archiveData] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getArchivePageData({
      folderId: resolvedSearchParams.folder,
      spaceId: resolvedSearchParams.space,
      query: resolvedSearchParams.query,
      sort: resolvedSearchParams.sort,
    }),
  ]);

  return (
    <DashboardShell
      activeView="archive"
      spaces={spaces}
      profile={profile}
      sidebar={
        <ArchiveSidebar
          folders={archiveData.folders}
          selectedFolderId={archiveData.selectedFolderId}
          defaultFolderId={archiveData.defaultFolderId}
          basePath="/archive"
          selectedSpaceId={archiveData.selectedSpaceId}
          allArchiveCount={archiveData.totalCount}
        />
      }
    >
      <ArchiveDashboard
        items={archiveData.items}
        folders={archiveData.folderOptions}
        spaceOptions={archiveData.spaceOptions}
        selectedFolderId={archiveData.selectedFolderId}
        selectedSpaceId={archiveData.selectedSpaceId}
        searchQuery={archiveData.searchQuery}
        sort={archiveData.sort}
        totalCount={archiveData.totalCount}
      />
    </DashboardShell>
  );
}
