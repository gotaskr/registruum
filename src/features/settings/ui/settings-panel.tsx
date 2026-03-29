export function SettingsPanel() {
  return (
    <section className="grid gap-0 md:grid-cols-2">
      <div className="border-b border-border px-6 py-5 md:border-r">
        <p className="text-sm font-medium text-foreground">Visibility</p>
        <p className="mt-1 text-sm text-muted">Who can see this work order and its updates.</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Show members list</span>
            <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-semibold text-[#356dff]">On</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Expose logs to contractors</span>
            <span className="rounded-full bg-[#f3f5f8] px-2.5 py-1 text-xs font-semibold text-[#6b778c]">Off</span>
          </div>
        </div>
      </div>
      <div className="border-b border-border px-6 py-5">
        <p className="text-sm font-medium text-foreground">Notifications</p>
        <p className="mt-1 text-sm text-muted">Keep managers and contractors synced on changes.</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Status change alerts</span>
            <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-semibold text-[#356dff]">On</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Daily summary digest</span>
            <span className="rounded-full bg-[#f3f5f8] px-2.5 py-1 text-xs font-semibold text-[#6b778c]">Off</span>
          </div>
        </div>
      </div>
    </section>
  );
}
