import type { ReactNode } from "react";

type MainShellProps = Readonly<{
  title: string;
  description?: string;
  meta?: ReactNode;
  subheader?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}>;

export function MainShell({
  title,
  description,
  meta,
  subheader,
  actions,
  children,
}: MainShellProps) {
  return (
    <main className="grid h-full min-h-0 min-w-0 grid-rows-[auto_1fr] bg-panel">
      <header className="border-b border-border bg-panel">
        <div className="flex min-h-[58px] flex-col justify-center gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-[15px] font-semibold text-foreground">{title}</h1>
            {meta ? <div className="flex flex-wrap items-center gap-3">{meta}</div> : null}
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {subheader ? (
          <div className="border-t border-border px-6 py-4">{subheader}</div>
        ) : null}
      </header>
      <div className="h-full min-h-0 overflow-y-auto">{children}</div>
    </main>
  );
}
