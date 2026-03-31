import "server-only";

import { parseLogDetails } from "@/features/logs/lib/log-details";
import {
  mapAttachmentRow,
  mapMessageRow,
  type AttachmentRow,
  type MessageRow,
  type ProfileRow,
} from "@/features/chat/lib/message-mappers";
import { getWorkOrderActorContext } from "@/features/work-orders/api/work-orders";
import { formatDateTimeLabel } from "@/lib/utils";
import { registruumFilesBucket } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";
import type { LogEntry } from "@/types/log";
import type { Message, MessageAttachment } from "@/types/message";

type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

function buildSystemMessageBody(log: LogEntry) {
  switch (log.action) {
    case "Created a work order":
      return `${log.actorName} created this work order.`;
    case "Updated work order status":
      return log.change?.before && log.change.after
        ? `${log.actorName} changed the status from ${log.change.before} to ${log.change.after}.`
        : log.details
          ? `${log.actorName} changed the status to ${log.details}.`
        : `${log.actorName} updated the work order status.`;
    case "Assigned a work order member":
      return log.details
        ? `${log.actorName} added ${log.details} to this work order.`
        : `${log.actorName} added a member to this work order.`;
    default:
      return log.action;
  }
}

function mapSystemLogRow(
  row: ActivityLogRow,
  profileById: Map<string, ProfileRow>,
): Message {
  const details = parseLogDetails(row.details);
  const actorName = row.actor_user_id
    ? (profileById.get(row.actor_user_id)?.full_name ?? "Unknown User")
    : "System";
  const logEntry: LogEntry = {
    id: row.id,
    workOrderId: row.work_order_id ?? "",
    actorUserId: row.actor_user_id,
    actorName,
    action: row.action,
    createdAt: formatDateTimeLabel(row.created_at),
    rawCreatedAt: row.created_at,
    details: details.summary,
    change:
      details.before || details.after
        ? {
            before: details.before,
            after: details.after,
          }
        : undefined,
  };

  return {
    id: `system-${row.id}`,
    kind: "system",
    workOrderId: row.work_order_id ?? "",
    senderUserId: null,
    senderName: "System",
    body: buildSystemMessageBody(logEntry),
    createdAt: logEntry.createdAt,
    rawCreatedAt: row.created_at,
    isCurrentUser: false,
    attachments: [],
  };
}

function shouldRenderAsSystemMessage(action: string) {
  return (
    action === "Created a work order" ||
    action === "Updated work order status" ||
    action === "Assigned a work order member"
  );
}

export async function getWorkOrderMessages(spaceId: string, workOrderId: string) {
  const context = await getWorkOrderActorContext(spaceId, workOrderId);
  const { data: messageRows, error: messageError } = await context.supabase
    .from("work_order_messages")
    .select("*")
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: true });

  if (messageError) {
    throw new Error(messageError.message);
  }

  const rows = (messageRows ?? []) as MessageRow[];
  const senderIds = [...new Set(rows.map((row) => row.sender_user_id))];
  const messageIds = rows.map((row) => row.id);

  const [
    { data: profileRows, error: profileError },
    { data: attachmentRows, error: attachmentError },
    { data: logRows, error: logError },
  ] =
    await Promise.all([
      senderIds.length > 0
        ? context.supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", senderIds)
        : Promise.resolve({ data: [], error: null }),
      messageIds.length > 0
        ? context.supabase
            .from("work_order_message_attachments")
            .select("*")
            .in("message_id", messageIds)
        : Promise.resolve({ data: [], error: null }),
      context.supabase
        .from("activity_logs")
        .select("*")
        .eq("space_id", spaceId)
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true }),
    ]);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (attachmentError) {
    throw new Error(attachmentError.message);
  }

  if (logError) {
    throw new Error(logError.message);
  }

  const profiles = (profileRows ?? []) as ProfileRow[];
  const attachments = (attachmentRows ?? []) as AttachmentRow[];
  const systemLogs = ((logRows ?? []) as ActivityLogRow[]).filter((row) =>
    shouldRenderAsSystemMessage(row.action),
  );
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const missingActorIds = [
    ...new Set(
      systemLogs
        .map((row) => row.actor_user_id)
        .filter(
          (value): value is string => value !== null && !profileById.has(value),
        ),
    ),
  ];

  if (missingActorIds.length > 0) {
    const { data: actorProfiles, error: actorProfileError } = await context.supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", missingActorIds);

    if (actorProfileError) {
      throw new Error(actorProfileError.message);
    }

    for (const profile of (actorProfiles ?? []) as ProfileRow[]) {
      profileById.set(profile.id, profile);
    }
  }

  const signedUrlByPath = new Map<string, string>();
  if (attachments.length > 0) {
    const signedUrlResults = await Promise.all(
      attachments.map(async (attachment) => {
        const { data, error } = await context.supabase.storage
          .from(registruumFilesBucket)
          .createSignedUrl(attachment.storage_path, 60 * 60);

        if (error || !data?.signedUrl) {
          return null;
        }

        return [attachment.storage_path, data.signedUrl] as const;
      }),
    );

    for (const result of signedUrlResults) {
      if (result) {
        signedUrlByPath.set(result[0], result[1]);
      }
    }
  }

  const attachmentMap = new Map<string, MessageAttachment[]>();

  const mappedAttachments = attachments.map((attachment) =>
    mapAttachmentRow(attachment, signedUrlByPath),
  );

  for (let index = 0; index < attachments.length; index += 1) {
    const current = attachmentMap.get(attachments[index].message_id) ?? [];
    current.push(mappedAttachments[index]);
    attachmentMap.set(attachments[index].message_id, current);
  }

  const userMessages = rows.map((row) => ({
    sortValue: row.created_at,
    message: mapMessageRow(row, profileById, attachmentMap, context.user.id),
  }));

  const systemMessages = systemLogs.map((row) => ({
    sortValue: row.created_at,
    message: mapSystemLogRow(row, profileById),
  }));

  return [...systemMessages, ...userMessages]
    .sort((left, right) => left.sortValue.localeCompare(right.sortValue))
    .map((entry) => entry.message);
}
