"use client";

import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  RealtimeChannel,
  RealtimePostgresInsertPayload,
} from "@supabase/supabase-js";
import { ChatMessageItem } from "@/components/ui/chat-message-item";
import { InputBar } from "@/components/ui/input-bar";
import { FormMessage } from "@/features/auth/ui/form-message";
import {
  createOptimisticMessage,
  getWorkOrderMessageById,
  revokeMessageObjectUrls,
  sendWorkOrderMessage,
} from "@/features/chat/api/client-messages";
import { createWorkOrderMessageSchema } from "@/features/chat/schemas/chat.schema";
import { ChatEmptyState } from "@/features/chat/ui/chat-empty-state";
import { ChatHeader } from "@/features/chat/ui/chat-header";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getValidFiles } from "@/lib/supabase/storage";
import type { Message } from "@/types/message";
import type { WorkOrderStatus } from "@/types/work-order";

type ChatPanelProps = Readonly<{
  workOrderName: string;
  status: WorkOrderStatus;
  memberCount: number;
  messages: Message[];
  spaceId: string;
  workOrderId: string;
  actorUserId: string;
  actorName: string;
  canSendMessage: boolean;
  lockedMessage?: string;
}>;

const BOTTOM_THRESHOLD_PX = 32;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function compareAttachments(left: Message["attachments"], right: Message["attachments"]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((attachment, index) => {
    const other = right[index];
    return (
      attachment.id === other.id &&
      attachment.documentId === other.documentId &&
      attachment.fileName === other.fileName &&
      attachment.fileSizeBytes === other.fileSizeBytes &&
      attachment.mimeType === other.mimeType &&
      attachment.storagePath === other.storagePath &&
      attachment.isImage === other.isImage &&
      attachment.previewUrl === other.previewUrl &&
      attachment.downloadUrl === other.downloadUrl
    );
  });
}

function areMessagesEquivalent(left: Message, right: Message) {
  return (
    left.id === right.id &&
    left.kind === right.kind &&
    left.workOrderId === right.workOrderId &&
    left.senderUserId === right.senderUserId &&
    left.senderName === right.senderName &&
    left.body === right.body &&
    left.createdAt === right.createdAt &&
    left.rawCreatedAt === right.rawCreatedAt &&
    left.isCurrentUser === right.isCurrentUser &&
    left.status === right.status &&
    compareAttachments(left.attachments, right.attachments)
  );
}

function sortMessages(left: Message, right: Message) {
  const createdAtComparison = left.rawCreatedAt.localeCompare(right.rawCreatedAt);

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return left.id.localeCompare(right.id);
}

function isScrolledToBottom(element: HTMLDivElement) {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <=
    BOTTOM_THRESHOLD_PX
  );
}

function upsertMessage(current: Message[], incoming: Message) {
  const index = current.findIndex((message) => message.id === incoming.id);

  if (index < 0) {
    return [...current, incoming].sort(sortMessages);
  }

  const previous = current[index];
  if (areMessagesEquivalent(previous, incoming)) {
    return current;
  }

  const next = [...current];
  next[index] = incoming;

  if (previous !== incoming) {
    revokeMessageObjectUrls(previous);
  }

  return next.sort(sortMessages);
}

function updateMessageStatus(
  current: Message[],
  messageId: string,
  status: Extract<NonNullable<Message["status"]>, "sending" | "failed" | "sent">,
) {
  const index = current.findIndex((message) => message.id === messageId);

  if (index < 0) {
    return current;
  }

  const existing = current[index];
  if (existing.status === status) {
    return current;
  }

  const next = [...current];
  next[index] = {
    ...existing,
    status,
  };
  return next;
}

export function ChatPanel({
  workOrderName,
  status,
  memberCount,
  messages,
  spaceId,
  workOrderId,
  actorUserId,
  actorName,
  canSendMessage,
  lockedMessage,
}: ChatPanelProps) {
  const [renderedMessages, setRenderedMessages] = useState<Message[]>(() => messages);
  const [error, setError] = useState<string | undefined>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const hasScrolledInitiallyRef = useRef(false);
  const renderedMessagesRef = useRef<Message[]>(messages);
  const needsMoreMembers = memberCount < 2;
  const chatDisabledReason = needsMoreMembers
    ? "Need 2 or more members"
    : lockedMessage;
  const canUseChatInput = canSendMessage && !needsMoreMembers;
  const lastMessageKey = useMemo(() => {
    const lastMessage = renderedMessages[renderedMessages.length - 1];

    if (!lastMessage) {
      return "empty";
    }

    return `${lastMessage.id}:${lastMessage.status ?? "stable"}:${lastMessage.attachments.length}`;
  }, [renderedMessages]);

  useEffect(() => {
    renderedMessagesRef.current = renderedMessages;
  }, [renderedMessages]);

  useEffect(
    () => () => {
      for (const message of renderedMessagesRef.current) {
        revokeMessageObjectUrls(message);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    if (!hasScrolledInitiallyRef.current) {
      container.scrollTop = container.scrollHeight;
      hasScrolledInitiallyRef.current = true;
      shouldStickToBottomRef.current = true;
      return;
    }

    if (!shouldStickToBottomRef.current) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [lastMessageKey]);

  const reconcileMessage = useEffectEvent(async (messageId: string) => {
    try {
      const nextMessage = await getWorkOrderMessageById({
        messageId,
        currentUserId: actorUserId,
      });

      if (!nextMessage) {
        return;
      }

      if (nextMessage.workOrderId !== workOrderId) {
        return;
      }

      setRenderedMessages((current) => upsertMessage(current, nextMessage));
    } catch (nextError) {
      console.error(nextError);
    }
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`work-order-chat:${workOrderId}`)
      .on("broadcast", { event: "message-created" }, (payload) => {
        if (
          payload.payload &&
          typeof payload.payload === "object" &&
          "messageId" in payload.payload &&
          typeof payload.payload.messageId === "string"
        ) {
          void reconcileMessage(payload.payload.messageId);
        }
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "work_order_messages",
          filter: `work_order_id=eq.${workOrderId}`,
        },
        (payload: RealtimePostgresInsertPayload<{ id: string }>) => {
          if (typeof payload.new.id === "string") {
            void reconcileMessage(payload.new.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "work_order_message_attachments",
        },
        (payload: RealtimePostgresInsertPayload<{ message_id: string }>) => {
          if (typeof payload.new.message_id === "string") {
            void reconcileMessage(payload.new.message_id);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [workOrderId]);

  const persistOptimisticMessage = async (
    optimisticMessage: Message,
    files: ReadonlyArray<File>,
  ) => {
    try {
      const savedMessage = await sendWorkOrderMessage({
        spaceId,
        workOrderId,
        actorUserId,
        actorName,
        body: optimisticMessage.body,
        files,
        messageId: optimisticMessage.id,
      });

      setRenderedMessages((current) => upsertMessage(current, savedMessage));
      await channelRef.current?.send({
        type: "broadcast",
        event: "message-created",
        payload: {
          messageId: savedMessage.id,
          workOrderId,
        },
      });
      setError(undefined);
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Unable to send message.";

      setRenderedMessages((current) =>
        updateMessageStatus(current, optimisticMessage.id, "failed"),
      );
      setError(message);
    }
  };

  const handleSubmit = (formData: FormData) => {
    setError(undefined);

    const body = readText(formData, "body");
    const files = getValidFiles(formData, "files");
    const parsed = createWorkOrderMessageSchema.safeParse({
      spaceId,
      workOrderId,
      body,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Unable to send message.");
      return false;
    }

    if (!parsed.data.body && files.length === 0) {
      setError("Message cannot be empty.");
      return false;
    }

    shouldStickToBottomRef.current = true;

    const optimisticMessage = createOptimisticMessage({
      spaceId,
      workOrderId,
      actorUserId,
      actorName,
      body: parsed.data.body,
      files,
    });

    setRenderedMessages((current) => upsertMessage(current, optimisticMessage));
    void persistOptimisticMessage(optimisticMessage, files);

    return true;
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    shouldStickToBottomRef.current = isScrolledToBottom(container);
  };

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr_auto]">
      <ChatHeader
        workOrderName={workOrderName}
        status={status}
        memberCount={memberCount}
      />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 overflow-y-auto px-6 py-5"
      >
        <FormMessage
          message={error ?? chatDisabledReason}
          tone={error ? "error" : "info"}
        />
        <div className="space-y-4">
          {renderedMessages.length > 0 ? (
            renderedMessages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </div>
      <InputBar
        onSubmit={handleSubmit}
        hiddenFields={[
          { name: "spaceId", value: spaceId },
          { name: "workOrderId", value: workOrderId },
        ]}
        inputName="body"
        fileInputName="files"
        placeholder={
          canUseChatInput
            ? "Message the work order team"
            : needsMoreMembers
              ? "Need 2 or more members"
              : "Messaging is disabled for this work order"
        }
        disabled={!canUseChatInput}
        disabledReason={needsMoreMembers ? "Need 2 or more members" : undefined}
      />
    </section>
  );
}
