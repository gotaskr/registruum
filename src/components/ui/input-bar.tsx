"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Paperclip, SendHorizontal } from "lucide-react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { cn } from "@/lib/utils";

type InputBarHiddenField = Readonly<{
  name: string;
  value: string;
}>;

type MentionCandidate = Readonly<{
  id: string;
  label: string;
  mentionText: string;
}>;

type InputBarProps = Readonly<{
  onSubmit: (payload: FormData) => boolean | Promise<boolean>;
  hiddenFields: InputBarHiddenField[];
  inputName: string;
  placeholder: string;
  fileInputName?: string;
  mentionCandidates?: MentionCandidate[];
  disabled?: boolean;
  disabledReason?: string;
}>;

function getMentionState(value: string, caretPosition: number) {
  const textBeforeCaret = value.slice(0, caretPosition);
  const match = textBeforeCaret.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);
  if (!match || typeof match.index !== "number") {
    return null;
  }

  return {
    query: match[1] ?? "",
    start: match.index + match[0].lastIndexOf("@"),
    end: caretPosition,
  };
}

export function InputBar({
  onSubmit,
  hiddenFields,
  inputName,
  placeholder,
  fileInputName,
  mentionCandidates = [],
  disabled = false,
  disabledReason,
}: InputBarProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [bodyValue, setBodyValue] = useState("");
  const [caretPosition, setCaretPosition] = useState(0);

  const mentionState = getMentionState(bodyValue, caretPosition);
  const filteredMentions = useMemo(() => {
    if (!mentionState) {
      return [];
    }

    const query = mentionState.query.trim().toLowerCase();
    const items = mentionCandidates.filter((candidate) =>
      query.length === 0
        ? true
        : candidate.label.toLowerCase().includes(query) ||
          candidate.mentionText.toLowerCase().includes(query),
    );

    return items.slice(0, 6);
  }, [mentionCandidates, mentionState]);

  const mentionMenuOpen = mentionState !== null && filteredMentions.length > 0 && !disabled;

  const replaceMentionToken = (mentionText: string) => {
    if (!mentionState) {
      return;
    }
    const replacement = `@${mentionText} `;
    const nextValue =
      bodyValue.slice(0, mentionState.start) +
      replacement +
      bodyValue.slice(mentionState.end);
    const nextCaret = mentionState.start + replacement.length;

    setBodyValue(nextValue);
    setCaretPosition(nextCaret);
    queueMicrotask(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionMenuOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      return;
    }

    if (mentionMenuOpen && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      replaceMentionToken(filteredMentions[0].mentionText);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey && !disabled) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = formRef.current;
    if (!form || disabled) {
      return;
    }

    void (async () => {
      const result = onSubmit(new FormData(form));
      const accepted = result instanceof Promise ? await result : result;
      if (accepted) {
        form.reset();
        setBodyValue("");
        setCaretPosition(0);
      }
    })();
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "shrink-0 border-t border-border bg-panel/95 backdrop-blur-sm",
        "px-3 pt-2.5 pb-4 sm:px-4 sm:pt-3 lg:pb-3",
      )}
    >
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <div
        className="flex items-end gap-1.5 sm:gap-2"
        title={disabled && disabledReason ? disabledReason : undefined}
      >
        {fileInputName ? (
          <>
            <FileUploadField
              name={fileInputName}
              buttonLabel="Attach files"
              disabled={disabled}
              compact
              icon={Paperclip}
              iconOnly
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.avi,.mkv"
              title="Attach files"
            />
            <FileUploadField
              name={fileInputName}
              buttonLabel="Attach photos"
              disabled={disabled}
              compact
              icon={ImagePlus}
              iconOnly
              accept=".jpg,.jpeg,.png,.webp"
              title="Attach photos"
            />
          </>
        ) : null}
        <div className="relative flex-1">
          {mentionMenuOpen ? (
            <div className="absolute bottom-[calc(100%+0.35rem)] left-0 z-20 w-full overflow-hidden rounded-xl border border-border bg-panel shadow-lg">
              <ul className="max-h-52 overflow-y-auto py-1">
                {filteredMentions.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => replaceMentionToken(candidate.mentionText)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-panel-muted"
                    >
                      <span className="truncate font-medium text-foreground">
                        {candidate.label}
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-muted">
                        @{candidate.mentionText}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            name={inputName}
            rows={1}
            value={bodyValue}
            disabled={disabled}
            placeholder={placeholder}
            title={disabled && disabledReason ? disabledReason : undefined}
            onChange={(event) => {
              setBodyValue(event.target.value);
              setCaretPosition(event.target.selectionStart ?? event.target.value.length);
            }}
            onClick={(event) => setCaretPosition(event.currentTarget.selectionStart ?? 0)}
            onKeyUp={(event) => setCaretPosition(event.currentTarget.selectionStart ?? 0)}
            onKeyDown={handleKeyDown}
            className={cn(
              "min-h-11 w-full resize-none rounded-[1.05rem] border border-border bg-panel-muted px-3 py-2.5 text-[15px] leading-snug text-foreground outline-none sm:min-h-10 sm:rounded-lg sm:px-4 sm:text-sm sm:leading-normal",
              "placeholder:text-muted/80",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "max-h-[min(36dvh,11rem)]",
            )}
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          title={disabled && disabledReason ? disabledReason : "Send message"}
          aria-label="Send message"
          className={cn(
            "inline-flex h-11 w-11 shrink-0 items-center justify-center gap-0 rounded-[1.05rem] bg-slate-950 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:h-10 sm:w-auto sm:gap-2 sm:rounded-lg sm:px-4",
            "disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500",
          )}
        >
          <SendHorizontal className="h-[1.15rem] w-[1.15rem] sm:h-4 sm:w-4" aria-hidden />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </form>
  );
}
