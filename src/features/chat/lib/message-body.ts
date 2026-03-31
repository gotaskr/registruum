export const attachmentsOnlyMessageBody = "[attachments]";

export function normalizeStoredMessageBody(body: string) {
  return body === attachmentsOnlyMessageBody ? "" : body;
}
