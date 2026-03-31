import type { LogEntry } from "@/types/log";
import type { Message } from "@/types/message";

export type DocumentFolder = Readonly<{
  id: string;
  name: string;
  itemCount: number;
}>;

export function getMessagesByWorkOrderId(workOrderId: string): Message[] {
  return [
    {
      id: `${workOrderId}-message-1`,
      kind: "system",
      workOrderId,
      senderUserId: null,
      senderName: "Registruum Bot",
      body: "Chat remains mocked in Phase 3 while auth, spaces, memberships, and work orders are now live.",
      createdAt: "Now",
      rawCreatedAt: new Date().toISOString(),
      isCurrentUser: false,
      attachments: [],
    },
    {
      id: `${workOrderId}-message-2`,
      kind: "user",
      workOrderId,
      senderUserId: "current-user",
      senderName: "You",
      body: "This module will be wired to real-time messaging in a later phase.",
      createdAt: "Now",
      rawCreatedAt: new Date().toISOString(),
      isCurrentUser: true,
      attachments: [],
      status: "sent",
    },
  ];
}

export function getLogsByWorkOrderId(workOrderId: string): LogEntry[] {
  return [
    {
      id: `${workOrderId}-log-1`,
      workOrderId,
      actorUserId: null,
      actorName: "Registruum",
      action: "Work order metadata is now loading from Supabase.",
      createdAt: "Today",
    },
    {
      id: `${workOrderId}-log-2`,
      workOrderId,
      actorUserId: null,
      actorName: "Registruum",
      action: "Detailed system logs remain mocked for Phase 3.",
      createdAt: "Today",
    },
  ];
}

export function getDocumentFoldersByWorkOrderId(
  workOrderId: string,
): DocumentFolder[] {
  return [
    {
      id: `${workOrderId}-documents-1`,
      name: "Inspection Pack",
      itemCount: 3,
    },
    {
      id: `${workOrderId}-documents-2`,
      name: "Vendor Notes",
      itemCount: 2,
    },
  ];
}
