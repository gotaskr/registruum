export function formatStorageCap(bytes: number | null): string {
  if (bytes == null) {
    return "Unlimited";
  }

  const gb = 1024 * 1024 * 1024;
  const tb = 1024 * gb;

  if (bytes >= tb) {
    return `${Math.round((bytes / tb) * 10) / 10} TB`;
  }

  return `${Math.round((bytes / gb) * 10) / 10} GB`;
}

export function spacesLabel(maxSpaces: number | null): string {
  if (maxSpaces == null) {
    return "Unlimited spaces";
  }

  return maxSpaces === 1 ? "1 space" : `${maxSpaces} spaces`;
}

/** Cap on team members (space roster), not work-order assignees. */
export function teamMembersLabel(maxMembers: number | null): string {
  if (maxMembers == null) {
    return "Unlimited team members";
  }

  return maxMembers === 1 ? "1 team member" : `${maxMembers} team members`;
}

/** Product policy: work-order member assignments are not limited by plan. */
export function unlimitedWorkOrderMembersLabel(): string {
  return "Unlimited work order members";
}

/** Hard cap on active (non-archived) work orders for the space owner's account. */
export function workOrdersLabel(maxActive: number | null): string {
  if (maxActive == null) {
    return "Unlimited work orders";
  }

  const noun = maxActive === 1 ? "work order" : "work orders";
  return `${maxActive} ${noun}`;
}

export function bandwidthLabel(bytes: number | null): string {
  if (bytes == null) {
    return "Unlimited bandwidth";
  }

  return `${formatStorageCap(bytes)} bandwidth / month`;
}
