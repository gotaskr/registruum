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
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-panel-muted px-3 py-3"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
          resolvedChecked ? "bg-slate-900" : "bg-slate-300",
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
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            resolvedChecked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </label>
  );
}
