import { notFound } from "next/navigation";
import { getArchivePageData } from "@/features/archive/api/archive";
import { canAccessSpaceArchive } from "@/features/permissions/lib/roles";
import { getSpaceByIdForUser } from "@/features/spaces/api/spaces";
import { SpaceArchiveScreen } from "@/features/spaces/ui/space-archive-screen";

type SpaceArchivePageProps = Readonly<{
  params: Promise<{
    spaceId: string;
  }>;
  searchParams?: Promise<{
    folder?: string;
    query?: string;
    sort?: string;
  }>;
}>;

export default async function SpaceArchivePage({
  params,
  searchParams,
}: SpaceArchivePageProps) {
  const { spaceId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const [space, archiveData] = await Promise.all([
    getSpaceByIdForUser(spaceId),
    getArchivePageData({
      spaceId,
      folderId: resolvedSearchParams.folder,
      query: resolvedSearchParams.query,
      sort: resolvedSearchParams.sort,
    }),
  ]);

  if (!canAccessSpaceArchive(space.membershipRole)) {
    notFound();
  }

  return (
    <SpaceArchiveScreen
      space={space}
      folders={archiveData.folders}
      selectedFolderId={archiveData.selectedFolderId}
      defaultFolderId={archiveData.defaultFolderId}
      items={archiveData.items}
      searchQuery={archiveData.searchQuery}
      sort={archiveData.sort}
      totalCount={archiveData.totalCount}
    />
  );
}
