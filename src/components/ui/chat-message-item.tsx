import { memo } from "react";
import { MessageAttachmentList } from "@/components/ui/message-attachment-list";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";

type ChatMessageItemProps = Readonly<{
  message: Message;
}>;

function ChatMessageItemComponent({ message }: ChatMessageItemProps) {
  if (message.kind === "system") {
    return (
      <div className="flex justify-center">
        <div className="max-w-2xl rounded-full border border-border bg-panel-muted px-4 py-2 text-center text-xs text-muted">
          <span className="font-medium text-foreground">{message.body}</span>
          <span className="ml-2">{message.createdAt}</span>
        </div>
      </div>
    );
  }

  const deliveryLabel =
    message.status === "sending"
      ? "Sending..."
      : message.status === "failed"
        ? "Failed to send"
        : null;

  return (
    <div
      className={cn(
        "flex w-full",
        message.isCurrentUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-xl rounded-2xl border px-4 py-3",
          message.isCurrentUser
            ? message.status === "failed"
              ? "border-rose-700 bg-rose-950 text-white"
              : "border-slate-900 bg-slate-900 text-white"
            : "border-border bg-panel",
        )}
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold">{message.senderName}</span>
          <span className={message.isCurrentUser ? "text-slate-300" : "text-muted"}>
            {message.createdAt}
          </span>
          {deliveryLabel ? (
            <span
              className={cn(
                message.status === "failed"
                  ? message.isCurrentUser
                    ? "text-rose-200"
                    : "text-rose-600"
                  : message.isCurrentUser
                    ? "text-slate-300"
                    : "text-muted",
              )}
            >
              {deliveryLabel}
            </span>
          ) : null}
        </div>
        {message.body ? <p className="mt-2 text-sm leading-6">{message.body}</p> : null}
        {message.attachments.length > 0 ? (
          <MessageAttachmentList
            attachments={message.attachments}
            isCurrentUser={message.isCurrentUser}
          />
        ) : null}
      </div>
    </div>
  );
}

export const ChatMessageItem = memo(ChatMessageItemComponent);
