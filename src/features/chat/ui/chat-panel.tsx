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
import { checkWorkOrderAttachmentPlanLimits } from "@/features/settings/actions/plan-limit-checks.actions";
import { usePlanLimitModal } from "@/features/settings/hooks/use-plan-limit-modal";
import type { UpgradePrompt } from "@/features/settings/types/upgrade-prompt";
import { UpgradeRequiredModal } from "@/features/settings/ui/upgrade-required-modal";
import {
  createOptimisticMessage,
  deleteWorkOrderMessage,
  getWorkOrderMessageById,
  revokeMessageObjectUrls,
  sendWorkOrderMessage,
  toggleMessageReaction,
} from "@/features/chat/api/client-messages";
import { createWorkOrderMessageSchema } from "@/features/chat/schemas/chat.schema";
import { ChatEmptyState } from "@/features/chat/ui/chat-empty-state";
import { ChatHeader } from "@/features/chat/ui/chat-header";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getValidFiles } from "@/lib/supabase/storage";
import type { Message } from "@/types/message";
import type { WorkOrderStatus } from "@/types/work-order";
import type { WorkOrderMember } from "@/features/members/types/work-order-member";

type ChatPanelProps = Readonly<{
  workOrderName: string;
  status: WorkOrderStatus;
  memberCount: number;
  messages: Message[];
  spaceId: string;
  workOrderId: string;
  actorUserId: string;
  actorName: string;
  members: WorkOrderMember[];
  canSendMessage: boolean;
  lockedMessage?: string;
  /** When true, skip the in-panel title row (work order shell already shows name + status). */
  embeddedInWorkOrderShell?: boolean;
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
    left.replyToMessageId === right.replyToMessageId &&
    left.replyToPreview === right.replyToPreview &&
    left.deletedAt === right.deletedAt &&
    left.deletedByCurrentUser === right.deletedByCurrentUser &&
    left.reactions.up === right.reactions.up &&
    left.reactions.down === right.reactions.down &&
    left.reactions.currentUserReaction === right.reactions.currentUserReaction &&
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
  members,
  canSendMessage,
  lockedMessage,
  embeddedInWorkOrderShell = false,
}: ChatPanelProps) {
  const [renderedMessages, setRenderedMessages] = useState<Message[]>(() => messages);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [upgradePrompt, setUpgradePrompt] = useState<UpgradePrompt | undefined>(undefined);
  const [planLimitAttemptKey, setPlanLimitAttemptKey] = useState(0);
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
  const { modalPrompt, closeModal } = usePlanLimitModal(
    { error, upgradePrompt },
    { attemptKey: planLimitAttemptKey },
  );
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
      .on("broadcast", { event: "reaction-updated" }, (payload) => {
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
          event: "*",
          schema: "public",
          table: "work_order_messages",
          filter: `work_order_id=eq.${workOrderId}`,
        },
        (payload) => {
          if ("id" in payload.new && typeof payload.new.id === "string") {
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "work_order_message_reactions",
        },
        (payload) => {
          if ("message_id" in payload.new && typeof payload.new.message_id === "string") {
            void reconcileMessage(payload.new.message_id);
          }
          if ("message_id" in payload.old && typeof payload.old.message_id === "string") {
            void reconcileMessage(payload.old.message_id);
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
        replyToMessageId: optimisticMessage.replyToMessageId,
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
      setUpgradePrompt(undefined);
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Unable to send message.";

      setRenderedMessages((current) =>
        updateMessageStatus(current, optimisticMessage.id, "failed"),
      );
      setError(message);
      setUpgradePrompt(undefined);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setError(undefined);
    setUpgradePrompt(undefined);

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

    if (files.length > 0) {
      const additionalBytes = files.reduce((sum, file) => sum + file.size, 0);
      const limitCheck = await checkWorkOrderAttachmentPlanLimits({
        spaceId,
        additionalBytes,
        userId: actorUserId,
      });
      if (!limitCheck.ok) {
        setPlanLimitAttemptKey((key) => key + 1);
        setError(limitCheck.message);
        setUpgradePrompt(limitCheck.upgradePrompt);
        return false;
      }
    }

    shouldStickToBottomRef.current = true;

    const optimisticMessage = createOptimisticMessage({
      spaceId,
      workOrderId,
      actorUserId,
      actorName,
      body: parsed.data.body,
      files,
      replyToMessageId: replyingTo?.id ?? null,
    });

    setRenderedMessages((current) => upsertMessage(current, optimisticMessage));
    setReplyingTo(null);
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

  const handleDeleteMessage = async (messageId: string) => {
    await deleteWorkOrderMessage({ messageId, userId: actorUserId });
    await reconcileMessage(messageId);
  };

  const handleToggleReaction = async (messageId: string, reaction: "up" | "down") => {
    await toggleMessageReaction({ messageId, userId: actorUserId, reaction });
    await channelRef.current?.send({
      type: "broadcast",
      event: "reaction-updated",
      payload: {
        messageId,
        workOrderId,
      },
    });
    await reconcileMessage(messageId);
  };

  return (
    <>
    <section
      className={
        embeddedInWorkOrderShell
          ? "flex h-full min-h-0 min-w-0 flex-col"
          : "grid h-full min-h-0 grid-rows-[auto_1fr_auto]"
      }
    >
      {embeddedInWorkOrderShell ? null : (
        <ChatHeader
          workOrderName={workOrderName}
          status={status}
          memberCount={memberCount}
        />
      )}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain",
          "px-3 pt-2 pb-2 sm:px-5 sm:pt-4 sm:pb-3",
        )}
      >
        <FormMessage
          message={error ?? chatDisabledReason}
          tone={error ? "error" : "info"}
          className="mb-2 rounded-xl px-3 py-2.5 text-xs leading-snug shadow-none sm:mb-3 sm:rounded-[1.1rem] sm:px-4 sm:py-3 sm:text-sm sm:leading-6"
        />
        <div className="space-y-3 sm:space-y-4">
          {renderedMessages.length > 0 ? (
            renderedMessages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onReply={setReplyingTo}
                onDelete={handleDeleteMessage}
                onToggleReaction={handleToggleReaction}
              />
            ))
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </div>
      {replyingTo ? (
        <div className="border-t border-border bg-panel px-3 py-2 text-xs text-muted sm:px-4">
          Replying to {replyingTo.isCurrentUser ? "yourself" : replyingTo.senderName}:{" "}
          {(replyingTo.body || "Attachment").slice(0, 100)}
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="ml-2 text-foreground underline"
          >
            Cancel
          </button>
        </div>
      ) : null}
      <InputBar
        onSubmit={handleSubmit}
        hiddenFields={[
          { name: "spaceId", value: spaceId },
          { name: "workOrderId", value: workOrderId },
        ]}
        inputName="body"
        fileInputName="files"
        mentionCandidates={members
          .map((member) => ({
            id: member.userId,
            label: member.name,
            mentionText: member.name,
          }))}
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
    <UpgradeRequiredModal prompt={modalPrompt} onClose={closeModal} />
    </>
  );
}
