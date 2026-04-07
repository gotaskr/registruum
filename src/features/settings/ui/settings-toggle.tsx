"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type SettingsToggleProps = Readonly<{
  label: string;
  description?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}>;

export function SettingsToggle({
  label,
  description,
  defaultChecked = false,
  checked,
  onCheckedChange,
}: SettingsToggleProps) {
  const inputId = useId();
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const resolvedChecked = checked ?? internalChecked;

  const handleChange = () => {
    const nextValue = !resolvedChecked;

    if (checked === undefined) {
      setInternalChecked(nextValue);
    }

    onCheckedChange?.(nextValue);
  };

  return (
    <label
      htmlFor={inputId}
      className="flex items-center justify-between gap-4 rounded-[1.45rem] border border-border bg-panel-muted px-4 py-4"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      <span
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors",
          resolvedChecked ? "bg-accent" : "bg-border-strong",
        )}
      >
        <input
          id={inputId}
          type="checkbox"
          checked={resolvedChecked}
          onChange={handleChange}
          className="sr-only"
        />
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-panel shadow-sm transition-transform dark:shadow-none",
            resolvedChecked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </label>
  );
}
