"use client";

import { useRef } from "react";
import { ImagePlus, Paperclip } from "lucide-react";
import { FileUploadField } from "@/components/ui/file-upload-field";

type InputBarHiddenField = Readonly<{
  name: string;
  value: string;
}>;

type InputBarProps = Readonly<{
  action: (payload: FormData) => void;
  hiddenFields: InputBarHiddenField[];
  inputName: string;
  placeholder: string;
  fileInputName?: string;
  disabled?: boolean;
  disabledReason?: string;
}>;

export function InputBar({
  action,
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

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-3 border-t border-border bg-panel px-4 py-3"
    >
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <div
        className="flex items-end gap-2"
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
          className="h-10 flex-1 resize-none rounded-lg border border-border bg-panel-muted px-4 py-2.5 text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
    </form>
  );
}
