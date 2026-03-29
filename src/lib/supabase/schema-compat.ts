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
