"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Paperclip, type LucideIcon, X } from "lucide-react";

type FileUploadFieldProps = Readonly<{
  name: string;
  label?: string;
  buttonLabel: string;
  helperText?: string;
  disabled?: boolean;
  compact?: boolean;
  accept?: string;
  icon?: LucideIcon;
  iconOnly?: boolean;
  title?: string;
  onFilesChange?: (count: number) => void;
}>;

type SelectedFile = Readonly<{
  id: string;
  name: string;
  size: number;
}>;

function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadField({
  name,
  label,
  buttonLabel,
  helperText,
  disabled = false,
  compact = false,
  accept,
  icon: Icon = Paperclip,
  iconOnly = false,
  title,
  onFilesChange,
}: FileUploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onFilesChangeRef = useRef(onFilesChange);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  }, [onFilesChange]);

  const syncInputFiles = (files: File[]) => {
    const dataTransfer = new DataTransfer();

    files.forEach((file) => dataTransfer.items.add(file));

    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;
    }

    setSelectedFiles(
      files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        name: file.name,
        size: file.size,
      })),
    );
    onFilesChangeRef.current?.(files.length);
  };

  const getCurrentFiles = () =>
    inputRef.current?.files ? Array.from(inputRef.current.files) : [];

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) {
      return;
    }

    const handleReset = () => {
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setSelectedFiles([]);
      onFilesChangeRef.current?.(0);
    };

    form.addEventListener("reset", handleReset);
    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, []);

  const handleChange = () => {
    const existingFiles = getCurrentFiles();
    const uniqueFiles = Array.from(
      new Map(
        existingFiles.map((file) => [
          `${file.name}-${file.lastModified}-${file.size}`,
          file,
        ]),
      ).values(),
    );

    syncInputFiles(uniqueFiles);
  };

  const handleRemove = (fileId: string) => {
    const remainingFiles = getCurrentFiles().filter(
      (file) => `${file.name}-${file.lastModified}-${file.size}` !== fileId,
    );

    syncInputFiles(remainingFiles);
  };

  return (
    <div className="space-y-2">
      {label ? (
        <span className="block text-sm font-medium text-foreground">{label}</span>
      ) : null}
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        className="hidden"
        onChange={handleChange}
      />
      <label
        htmlFor={inputId}
        title={title ?? buttonLabel}
        className={[
          "inline-flex cursor-pointer items-center rounded-lg border border-border bg-panel-muted text-sm font-medium text-foreground",
          iconOnly ? "w-10 justify-center px-0" : "gap-2 px-3",
          compact ? "h-10" : "h-10",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon className="h-4 w-4" />
        {iconOnly ? <span className="sr-only">{buttonLabel}</span> : <span>{buttonLabel}</span>}
      </label>
      {helperText ? <p className="text-xs text-muted">{helperText}</p> : null}
      {selectedFiles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-xs text-foreground"
            >
              <span>{file.name}</span>
              <span className="text-muted">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="inline-flex h-4 w-4 items-center justify-center rounded text-muted hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
