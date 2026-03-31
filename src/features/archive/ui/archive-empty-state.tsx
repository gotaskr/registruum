import { FolderTree, LockKeyhole } from "lucide-react";

export function ArchiveEmptyState() {
  return (
    <section className="grid min-h-[calc(100vh-16rem)] place-items-center px-6 py-12 lg:px-8">
      <div className="w-full max-w-xl rounded-[24px] border border-border bg-panel px-8 py-9 text-center shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-panel-muted">
          <LockKeyhole className="h-5 w-5 text-foreground" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
          No archived work orders yet
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Completed work orders will appear here automatically.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-panel-muted px-3 py-2 text-sm text-muted">
          <FolderTree className="h-4 w-4" />
          Use folders to organize records anytime.
        </div>
      </div>
    </section>
  );
}
