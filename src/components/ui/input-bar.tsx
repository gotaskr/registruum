"use client";

import { useRef } from "react";
import { ImagePlus, Paperclip, SendHorizontal } from "lucide-react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { cn } from "@/lib/utils";

type InputBarHiddenField = Readonly<{
  name: string;
  value: string;
}>;

type InputBarProps = Readonly<{
  onSubmit: (payload: FormData) => boolean;
  hiddenFields: InputBarHiddenField[];
  inputName: string;
  placeholder: string;
  fileInputName?: string;
  disabled?: boolean;
  disabledReason?: string;
}>;

export function InputBar({
  onSubmit,
  hiddenFields,
  inputName,
  placeholder,
  fileInputName,
  disabled = false,
  disabledReason,
}: InputBarProps) {
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

    const accepted = onSubmit(new FormData(form));
    if (accepted) {
      form.reset();
    }
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
        <textarea
          name={inputName}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          title={disabled && disabledReason ? disabledReason : undefined}
          onKeyDown={handleKeyDown}
          className={cn(
            "min-h-11 flex-1 resize-none rounded-[1.05rem] border border-border bg-panel-muted px-3 py-2.5 text-[15px] leading-snug text-foreground outline-none sm:min-h-10 sm:rounded-lg sm:px-4 sm:text-sm sm:leading-normal",
            "placeholder:text-muted/80",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "max-h-[min(36dvh,11rem)]",
          )}
        />
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
