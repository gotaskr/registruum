type PostgrestLikeError = Readonly<{
  message?: string | null;
}> | null;

function hasMissingColumnError(
  error: PostgrestLikeError,
  relation: string,
  column: string,
) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes(`column ${relation}.${column} does not exist`);
}

export function isMissingSpaceMembershipStatusColumn(error: PostgrestLikeError) {
  return hasMissingColumnError(error, "space_memberships", "status");
}

function hasMissingRelationError(error: PostgrestLikeError, relation: string) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    message.includes(`relation "public.${relation}" does not exist`) ||
    message.includes(`could not find the table 'public.${relation}'`) ||
    message.includes(`could not find the relation 'public.${relation}'`)
  );
}

export function isMissingArchiveTableError(error: PostgrestLikeError) {
  return (
    hasMissingRelationError(error, "archive_folders") ||
    hasMissingRelationError(error, "archived_work_orders") ||
    hasMissingRelationError(error, "archive_activity_logs")
  );
}
