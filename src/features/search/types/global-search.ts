export type GlobalSearchSpaceHit = Readonly<{
  id: string;
  name: string;
  href: string;
}>;

export type GlobalSearchWorkOrderHit = Readonly<{
  id: string;
  title: string;
  spaceId: string;
  spaceName: string;
  href: string;
}>;

export type GlobalSearchArchiveHit = Readonly<{
  id: string;
  title: string;
  spaceId: string;
  spaceName: string;
  href: string;
}>;

export type GlobalSearchResponse = Readonly<{
  spaces: GlobalSearchSpaceHit[];
  workOrders: GlobalSearchWorkOrderHit[];
  archive: GlobalSearchArchiveHit[];
}>;
