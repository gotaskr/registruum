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
      <div className="flex justify-center px-0.5">
        <div className="max-w-[calc(100%-0.25rem)] rounded-2xl border border-border/80 bg-panel-muted/90 px-3 py-2 text-center text-[11px] leading-snug text-muted sm:max-w-2xl sm:rounded-full sm:px-4 sm:text-xs">
          <span className="font-medium text-foreground">{message.body}</span>
          <span className="mt-0.5 block text-muted sm:ml-2 sm:mt-0 sm:inline">{message.createdAt}</span>
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
          "max-w-[min(85%,20rem)] rounded-[1.1rem] border px-3 py-2.5 sm:max-w-xl sm:rounded-2xl sm:px-4 sm:py-3",
          message.isCurrentUser
            ? message.status === "failed"
              ? "border-rose-700 bg-rose-950 text-white"
              : "border-slate-900 bg-slate-900 text-white"
            : "border-border bg-panel",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
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
        {message.body ? (
          <p className="mt-1.5 text-[15px] leading-relaxed sm:mt-2 sm:text-sm sm:leading-6">{message.body}</p>
        ) : null}
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
