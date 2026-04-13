export function ChatEmptyState() {
  return (
    <div className="flex min-h-[min(42dvh,18rem)] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-gradient-to-b from-panel-muted/50 to-transparent px-4 py-10 text-center sm:min-h-[14rem] sm:px-8">
      <p className="max-w-[18rem] text-sm leading-relaxed text-muted sm:max-w-md">
        Start the conversation for this work order. Messages, updates, and shared files will appear
        here for the assigned team.
      </p>
    </div>
  );
}
