"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Paperclip, SendHorizontal } from "lucide-react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import {
  createOptimisticMessage,
  revokeMessageObjectUrls,
  sendWorkOrderMessage,
} from "@/features/chat/api/client-messages";
import { createWorkOrderMessageSchema } from "@/features/chat/schemas/chat.schema";
import type { MobileWorkOrderDetailsData } from "@/features/mobile/types/mobile";
import { getValidFiles } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import type { Message, MessageAttachment } from "@/types/message";

function compareAttachments(left: MessageAttachment[], right: MessageAttachment[]) {
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

export function MobileWorkOrderChatTab({
  data,
}: Readonly<{
  data: MobileWorkOrderDetailsData;
}>) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const hasScrolledInitiallyRef = useRef(false);
  const renderedMessagesRef = useRef<Message[]>(data.messages);
  const [renderedMessages, setRenderedMessages] = useState<Message[]>(() => data.messages);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const needsMoreMembers = data.members.length < 2;
  const chatDisabledReason = needsMoreMembers ? "Need 2 or more members" : data.lockedMessage;
  const canUseChatInput = data.canSendMessage && !needsMoreMembers;
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

  const persistOptimisticMessage = async (
    optimisticMessage: Message,
    files: ReadonlyArray<File>,
  ) => {
    try {
      const savedMessage = await sendWorkOrderMessage({
        spaceId: data.space.id,
        workOrderId: data.workOrder.id,
        actorUserId: data.actorUserId,
        actorName: data.actorName,
        body: optimisticMessage.body,
        files,
        messageId: optimisticMessage.id,
      });

      setRenderedMessages((current) => upsertMessage(current, savedMessage));
      setError(undefined);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Unable to send message.";

      setRenderedMessages((current) =>
        updateMessageStatus(current, optimisticMessage.id, "failed"),
      );
      setError(message);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = formRef.current;

    if (!form || !canUseChatInput) {
      return;
    }

    setError(undefined);

    const formData = new FormData(form);
    const files = getValidFiles(formData, "files");
    const parsed = createWorkOrderMessageSchema.safeParse({
      spaceId: data.space.id,
      workOrderId: data.workOrder.id,
      body,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Unable to send message.");
      return;
    }

    if (!parsed.data.body && files.length === 0) {
      setError("Message cannot be empty.");
      return;
    }

    shouldStickToBottomRef.current = true;

    const optimisticMessage = createOptimisticMessage({
      spaceId: data.space.id,
      workOrderId: data.workOrder.id,
      actorUserId: data.actorUserId,
      actorName: data.actorName,
      body: parsed.data.body,
      files,
    });

    setRenderedMessages((current) => upsertMessage(current, optimisticMessage));
    setBody("");
    form.reset();
    void persistOptimisticMessage(optimisticMessage, files);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div ref={scrollContainerRef} className="min-h-[29rem] max-h-[34rem] overflow-y-auto px-5 py-5">
        {error || chatDisabledReason ? (
          <div
            className={cn(
              "mb-4 rounded-2xl border px-4 py-3 text-sm",
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-slate-50 text-slate-600",
            )}
          >
            {error ?? chatDisabledReason}
          </div>
        ) : null}

        <div className="space-y-3">
          {renderedMessages.length > 0 ? (
            renderedMessages.map((message) => (
              <div
                key={message.id}
                className={
                  message.kind === "system"
                    ? "flex justify-center"
                    : cn("flex", message.isCurrentUser ? "justify-end" : "justify-start")
                }
              >
                {message.kind === "system" ? (
                  <div className="max-w-[90%] rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
                    {message.body}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "max-w-[85%] rounded-[22px] px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.05)]",
                      message.isCurrentUser
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-950",
                    )}
                  >
                    <p className="text-xs font-semibold opacity-70">{message.senderName}</p>
                    {message.body ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                    ) : null}
                    {message.attachments.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment) => (
                          <Link
                            key={attachment.id}
                            href={attachment.downloadUrl ?? "#"}
                            target="_blank"
                            className={cn(
                              "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                              message.isCurrentUser
                                ? "bg-white/10 text-white"
                                : "bg-slate-50 text-slate-700",
                            )}
                          >
                            <Paperclip className="h-4 w-4" />
                            <span className="truncate">{attachment.fileName}</span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] opacity-70">
                      <span>{message.createdAt}</span>
                      {message.status ? <span>{message.status}</span> : null}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex min-h-[20rem] items-center justify-center px-8 text-center text-[1.05rem] text-slate-500">
              No messages yet. Start the conversation!
            </div>
          )}
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-4 py-4">
        <input type="hidden" name="spaceId" value={data.space.id} />
        <input type="hidden" name="workOrderId" value={data.workOrder.id} />
        <div className="flex items-center gap-3">
          <FileUploadField
            name="files"
            buttonLabel="Attach files"
            disabled={!canUseChatInput}
            compact
            icon={Paperclip}
            iconOnly
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.avi,.mkv"
            title="Attach files"
          />
          <textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={!canUseChatInput}
            placeholder={
              canUseChatInput
                ? "Type a message..."
                : needsMoreMembers
                  ? "Need 2 or more members"
                  : "Messaging is disabled for this work order"
            }
            className="h-14 flex-1 resize-none rounded-full border border-slate-200 bg-white px-5 py-4 text-base text-slate-950 outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={!canUseChatInput}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
