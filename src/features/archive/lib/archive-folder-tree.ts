import type { ArchiveFolderOption } from "@/features/archive/types/archive";

type ArchiveFolderTreeNode = Readonly<{
  id: string;
  name: string;
  parentId: string | null;
  isSystemDefault: boolean;
}>;

export type ArchiveFolderTreeMetadata = Readonly<{
  orderedIds: string[];
  depthById: ReadonlyMap<string, number>;
  pathLabelById: ReadonlyMap<string, string>;
  descendantIdsById: ReadonlyMap<string, string[]>;
}>;

function compareArchiveFolderNodes(left: ArchiveFolderTreeNode, right: ArchiveFolderTreeNode) {
  if (left.isSystemDefault !== right.isSystemDefault) {
    return left.isSystemDefault ? -1 : 1;
  }

  return left.name.localeCompare(right.name);
}

export function buildArchiveFolderTreeMetadata(
  folders: ReadonlyArray<ArchiveFolderTreeNode>,
): ArchiveFolderTreeMetadata {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const childrenByParent = new Map<string | null, ArchiveFolderTreeNode[]>();

  for (const folder of folders) {
    const normalizedParentId =
      folder.parentId && folder.parentId !== folder.id && folderById.has(folder.parentId)
        ? folder.parentId
        : null;
    const siblings = childrenByParent.get(normalizedParentId) ?? [];

    siblings.push(folder);
    childrenByParent.set(normalizedParentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(compareArchiveFolderNodes);
  }

  const orderedIds: string[] = [];
  const depthById = new Map<string, number>();
  const pathLabelById = new Map<string, string>();
  const descendantIdsById = new Map<string, string[]>();

  function visit(folder: ArchiveFolderTreeNode, depth: number, parentNames: string[]) {
    const pathNames = [...parentNames, folder.name];
    const descendants = [folder.id];

    orderedIds.push(folder.id);
    depthById.set(folder.id, depth);
    pathLabelById.set(folder.id, pathNames.join(" / "));

    for (const child of childrenByParent.get(folder.id) ?? []) {
      descendants.push(...visit(child, depth + 1, pathNames));
    }

    descendantIdsById.set(folder.id, descendants);
    return descendants;
  }

  for (const rootFolder of childrenByParent.get(null) ?? []) {
    visit(rootFolder, 0, []);
  }

  return {
    orderedIds,
    depthById,
    pathLabelById,
    descendantIdsById,
  };
}

export function formatArchiveFolderOptionLabel(
  folder: Pick<ArchiveFolderOption, "name" | "depth">,
) {
  if (folder.depth <= 0) {
    return folder.name;
  }

  return `${"-- ".repeat(folder.depth)}${folder.name}`;
}
