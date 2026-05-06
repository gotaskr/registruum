import { memo, useEffect, useRef, useState } from "react";
import { EllipsisVertical, SmilePlus } from "lucide-react";
import { MessageAttachmentList } from "@/components/ui/message-attachment-list";
import { cn, sanitizePersonDisplayName } from "@/lib/utils";
import type { Message } from "@/types/message";

type ChatMessageItemProps = Readonly<{
  message: Message;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => Promise<void>;
  onToggleReaction?: (messageId: string, reaction: "up" | "down") => Promise<void>;
}>;

function renderHighlightedMentions(body: string, isCurrentUser: boolean) {
  const mentionPattern =
    /@([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,5}?)(?=(?:\s+[a-z]{2,}\b)|\s*$|[.,!?;:])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match = mentionPattern.exec(body);
  let keyIndex = 0;

  while (match) {
    const fullMatch = match[0];
    const index = match.index;
    if (index > lastIndex) {
      parts.push(body.slice(lastIndex, index));
    }
    parts.push(
      <span
        key={`mention-${keyIndex}`}
        className={cn(
          "font-medium",
          isCurrentUser
            ? "text-blue-300"
            : "text-blue-700 dark:text-blue-300",
        )}
      >
        {fullMatch}
      </span>,
    );
    keyIndex += 1;
    lastIndex = index + fullMatch.length;
    match = mentionPattern.exec(body);
  }

  if (lastIndex < body.length) {
    parts.push(body.slice(lastIndex));
  }

  return parts.length > 0 ? parts : body;
}

function formatViewerLocalTimestamp(value: string, fallback: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function ChatMessageItemComponent({
  message,
  onReply,
  onDelete,
  onToggleReaction,
}: ChatMessageItemProps) {
  const handleReply = () => {
    onReply?.(message);
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const [localTimestamp, setLocalTimestamp] = useState(message.createdAt);
  useEffect(() => {
    setLocalTimestamp(formatViewerLocalTimestamp(message.rawCreatedAt, message.createdAt));
  }, [message.rawCreatedAt, message.createdAt]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
      setReactionOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);
  const senderDisplayName = sanitizePersonDisplayName(message.senderName);

  if (message.kind === "system") {
    return (
      <div className="flex justify-center px-0.5">
        <div className="max-w-[calc(100%-0.25rem)] rounded-2xl border border-border/80 bg-panel-muted/90 px-3 py-2 text-center text-[11px] leading-snug text-muted sm:max-w-2xl sm:rounded-full sm:px-4 sm:text-xs">
          <span className="font-medium text-foreground">{message.body}</span>
          <span className="mt-0.5 block text-muted sm:ml-2 sm:mt-0 sm:inline">{localTimestamp}</span>
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

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
    holdTimerRef.current = window.setTimeout(() => {
      setReactionOpen(true);
    }, 450);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartXRef.current;
    const current = event.touches[0]?.clientX;
    if (start !== null && typeof current === "number" && current - start > 65) {
      handleReply();
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
      }
    }
  };

  const clearTouch = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    touchStartXRef.current = null;
  };

  const messageMenu = (
    <div
      className={cn(
        "relative flex shrink-0 items-center self-center",
        message.isCurrentUser ? "mr-1" : "ml-1",
      )}
    >
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className="rounded-md p-1 text-muted hover:bg-panel-muted hover:text-foreground"
        aria-label="Message options"
      >
        <EllipsisVertical className="h-4 w-4" />
      </button>
      {menuOpen ? (
        <div
          className={cn(
            "absolute top-7 z-10 w-36 rounded-lg border border-border bg-panel p-1 shadow-lg",
            message.isCurrentUser ? "left-0" : "right-0",
          )}
        >
          <button
            type="button"
            onClick={() => {
              handleReply();
              setMenuOpen(false);
            }}
            className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-panel-muted"
          >
            Reply
          </button>
          {message.isCurrentUser && !message.deletedAt ? (
            <button
              type="button"
              onClick={async () => {
                await onDelete?.(message.id);
                setMenuOpen(false);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-panel-muted"
            >
              Delete message
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex w-full",
        message.isCurrentUser ? "justify-end" : "justify-start",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={clearTouch}
      onTouchCancel={clearTouch}
    >
      {message.isCurrentUser ? messageMenu : null}
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
        {message.replyToPreview ? (
          <p className="mb-1 rounded-md border border-border/70 bg-panel-muted/70 px-2 py-1 text-[11px] text-muted">
            Replying to: {message.replyToPreview}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
          <span className="font-semibold">{senderDisplayName}</span>
          <span className={message.isCurrentUser ? "text-slate-300" : "text-muted"}>
            {localTimestamp}
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
          <p className="mt-1.5 text-[15px] leading-relaxed sm:mt-2 sm:text-sm sm:leading-6">
            {renderHighlightedMentions(message.body, message.isCurrentUser)}
          </p>
        ) : null}
        {message.attachments.length > 0 ? (
          <MessageAttachmentList
            attachments={message.attachments}
            isCurrentUser={message.isCurrentUser}
          />
        ) : null}
        <div className="mt-2 flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setReactionOpen((current) => !current)}
              className="rounded-md p-1 text-muted hover:bg-panel-muted hover:text-foreground"
              aria-label="React to message"
            >
              <SmilePlus className="h-4 w-4" />
            </button>
            {reactionOpen && !message.deletedAt ? (
              <div className="absolute left-0 top-7 z-10 flex items-center gap-1 rounded-lg border border-border bg-panel px-2 py-1 shadow-lg">
                <button
                  type="button"
                  onClick={async () => {
                    if (!onToggleReaction) {
                      return;
                    }
                    await onToggleReaction(message.id, "up");
                    setReactionOpen(false);
                  }}
                  className="text-sm"
                >
                  👍
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!onToggleReaction) {
                      return;
                    }
                    await onToggleReaction(message.id, "down");
                    setReactionOpen(false);
                  }}
                  className="text-sm"
                >
                  👎
                </button>
              </div>
            ) : null}
          </div>
          {(message.reactions.up > 0 || message.reactions.down > 0) && !message.deletedAt ? (
            <span className="text-xs text-muted">
              {message.reactions.up > 0 ? `👍 ${message.reactions.up} ` : ""}
              {message.reactions.down > 0 ? `👎 ${message.reactions.down}` : ""}
            </span>
          ) : null}
        </div>
      </div>
      {message.isCurrentUser ? null : messageMenu}
    </div>
  );
}

export const ChatMessageItem = memo(ChatMessageItemComponent);
