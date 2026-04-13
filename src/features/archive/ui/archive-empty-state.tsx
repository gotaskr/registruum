import { FolderTree, LockKeyhole } from "lucide-react";

export function ArchiveEmptyState() {
  return (
    <section className="grid min-h-[min(28rem,calc(100dvh-14rem))] place-items-center px-4 py-8 sm:min-h-[calc(100vh-16rem)] sm:px-6 sm:py-12 lg:px-8">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-panel px-5 py-7 text-center shadow-sm sm:rounded-[24px] sm:px-8 sm:py-9 sm:shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-panel-muted sm:h-12 sm:w-12 sm:rounded-2xl">
          <LockKeyhole className="h-5 w-5 text-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:mt-5 sm:text-2xl">
          No archived work orders yet
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:mt-3 sm:leading-6">
          Completed work orders will appear here automatically.
        </p>
        <div className="mt-5 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-panel-muted px-3 py-2 text-xs text-muted sm:mt-6 sm:text-sm">
          <FolderTree className="h-4 w-4 shrink-0" />
          <span>Use folders to organize records anytime.</span>
        </div>
      </div>
    </section>
  );
}
