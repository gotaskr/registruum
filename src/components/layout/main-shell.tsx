import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MainShellProps = Readonly<{
  title: string;
  description?: string;
  /** Merged into the description paragraph (e.g. hide on small screens). */
  descriptionClassName?: string;
  meta?: ReactNode;
  subheader?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Applied to the scrollable content region below the header (e.g. `overflow-hidden` for nested panes). */
  contentClassName?: string;
}>;

export function MainShell({
  title,
  description,
  descriptionClassName,
  meta,
  subheader,
  actions,
  children,
  contentClassName,
}: MainShellProps) {
  return (
    <main className="grid h-full min-h-0 min-w-0 grid-rows-[auto_1fr] bg-panel">
      <header className="border-b border-border bg-panel">
        <div className="flex min-h-[58px] items-start justify-between gap-3 px-4 py-3 sm:px-6 lg:items-center">
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {meta ? (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">{meta}</div>
              ) : null}
            </div>
            {description ? (
              <p
                className={cn(
                  "max-w-2xl text-sm leading-relaxed text-muted",
                  descriptionClassName,
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-col gap-2 pt-0.5 sm:flex-row sm:flex-wrap sm:items-center lg:pt-0">
              {actions}
            </div>
          ) : null}
        </div>
        {subheader ? (
          <div className="border-t border-border px-4 py-4 sm:px-6">{subheader}</div>
        ) : null}
      </header>
      <div className={cn("h-full min-h-0 overflow-y-auto", contentClassName)}>{children}</div>
    </main>
  );
}
