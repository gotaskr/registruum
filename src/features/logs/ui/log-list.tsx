"use client";

import { useMemo, useState } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { LogEntry } from "@/types/log";
import { cn } from "@/lib/utils";

type LogListProps = Readonly<{
  logs: LogEntry[];
}>;

const fieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted lg:text-xs lg:tracking-[0.18em]";

const inputClass =
  "h-11 w-full min-w-0 rounded-xl border border-border-strong bg-background px-3 text-[15px] text-foreground outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-[#2f5fd4]/35 disabled:opacity-60 lg:h-10 lg:text-sm";

function ActorActionFields({
  actorFilter,
  actionFilter,
  actorOptions,
  actionOptions,
  onActorChange,
  onActionChange,
}: Readonly<{
  actorFilter: string;
  actionFilter: string;
  actorOptions: string[];
  actionOptions: string[];
  onActorChange: (value: string) => void;
  onActionChange: (value: string) => void;
}>) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <label className="grid min-w-0 gap-1.5">
        <span className={fieldLabelClass}>Actor</span>
        <select
          value={actorFilter}
          onChange={(event) => onActorChange(event.target.value)}
          className={inputClass}
        >
          <option value="all">All actors</option>
          {actorOptions.map((actorName) => (
            <option key={actorName} value={actorName}>
              {actorName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid min-w-0 gap-1.5">
        <span className={fieldLabelClass}>Action</span>
        <select
          value={actionFilter}
          onChange={(event) => onActionChange(event.target.value)}
          className={inputClass}
        >
          <option value="all">All actions</option>
          {actionOptions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function LogList({ logs }: LogListProps) {
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const actorOptions = useMemo(
    () =>
      [...new Set(logs.map((entry) => entry.actorName))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [logs],
  );
  const actionOptions = useMemo(
    () =>
      [...new Set(logs.map((entry) => entry.action))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [logs],
  );
  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return logs.filter((entry) => {
      if (actorFilter !== "all" && entry.actorName !== actorFilter) {
        return false;
      }

      if (actionFilter !== "all" && entry.action !== actionFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        entry.action,
        entry.actorName,
        entry.details,
        entry.change?.before,
        entry.change?.after,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [actionFilter, actorFilter, logs, searchValue]);

  const hasActiveFilters =
    actorFilter !== "all" || actionFilter !== "all" || searchValue.trim().length > 0;

  const hasAdvancedFilters = actorFilter !== "all" || actionFilter !== "all";

  const resetActorAction = () => {
    setActorFilter("all");
    setActionFilter("all");
  };

  return (
    <section className="px-4 py-3 text-foreground sm:px-5 lg:px-6 lg:py-4">
      {/* Mobile: search + filter icon only */}
      <div className="mb-3 lg:hidden">
        <div className="flex items-center gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search logs</span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search logs…"
              className={cn(inputClass, "w-full")}
              enterKeyHint="search"
            />
          </label>
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={cn(
              "relative inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-border-strong bg-panel text-foreground transition-colors hover:bg-panel-muted",
              hasAdvancedFilters && "border-[#2f5fd4]/55 bg-[#eef3ff] dark:border-[#3d6fd9]/50 dark:bg-slate-800",
            )}
            aria-label="Open filters"
            aria-expanded={filterModalOpen}
          >
            <ListFilter className="h-5 w-5 text-foreground" aria-hidden />
            {hasAdvancedFilters ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#2f5fd4] ring-2 ring-white dark:ring-slate-900" />
            ) : null}
          </button>
        </div>
      </div>

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filters"
        description="Limit the timeline by person or action type."
        bottomSheetOnNarrow
        panelClassName="max-w-none lg:max-w-md"
      >
        <div className="space-y-5 px-4 py-4 sm:px-5">
          <ActorActionFields
            actorFilter={actorFilter}
            actionFilter={actionFilter}
            actorOptions={actorOptions}
            actionOptions={actionOptions}
            onActorChange={setActorFilter}
            onActionChange={setActionFilter}
          />
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="h-11 flex-1 touch-manipulation"
              disabled={!hasAdvancedFilters}
              onClick={resetActorAction}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="brand"
              className="h-11 flex-1 touch-manipulation"
              onClick={() => setFilterModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Desktop: full audit filter card */}
      <div className="mb-4 hidden rounded-xl border border-border-strong bg-panel p-4 shadow-sm lg:mb-6 lg:block lg:rounded-2xl lg:p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Audit view
          </p>
          <p className="mt-1 text-sm leading-snug text-foreground">
            Review who changed what on this work order and narrow the timeline when needed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:flex lg:flex-wrap lg:items-end">
          <label className="grid min-w-0 gap-1.5 lg:min-w-[14rem] lg:flex-1">
            <span className={fieldLabelClass}>Search</span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Person, action, or detail"
              className={inputClass}
              enterKeyHint="search"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:flex-1 lg:flex-wrap lg:gap-4">
            <label className="grid min-w-0 gap-1.5 lg:min-w-[11rem] lg:flex-1">
              <span className={fieldLabelClass}>Actor</span>
              <select
                value={actorFilter}
                onChange={(event) => setActorFilter(event.target.value)}
                className={inputClass}
              >
                <option value="all">All actors</option>
                {actorOptions.map((actorName) => (
                  <option key={actorName} value={actorName}>
                    {actorName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid min-w-0 gap-1.5 lg:min-w-[12rem] lg:flex-1">
              <span className={fieldLabelClass}>Action</span>
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className={inputClass}
              >
                <option value="all">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 lg:mb-4">
        <p className="text-xs font-medium text-foreground lg:text-sm">
          <span className="tabular-nums">{filteredLogs.length}</span>
          <span className="text-muted"> of </span>
          <span className="tabular-nums">{logs.length}</span>
          <span className="text-muted"> entries</span>
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setActorFilter("all");
              setActionFilter("all");
              setSearchValue("");
            }}
            className="text-xs font-semibold text-[#2f5fd4] hover:underline lg:text-sm dark:text-[#93c5fd]"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredLogs.length > 0 ? (
        <ul className="space-y-0" role="list">
          {filteredLogs.map((entry, index) => (
            <li
              key={entry.id}
              className="grid grid-cols-[0.75rem_1fr] gap-3 pb-5 sm:grid-cols-[1rem_1fr] sm:gap-4 sm:pb-6"
            >
              <div className="flex flex-col items-center pt-1">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2f5fd4] ring-4 ring-[#2f5fd4]/15 dark:ring-[#3d6fd9]/20"
                  aria-hidden
                />
                {index < filteredLogs.length - 1 ? (
                  <span className="mt-2 min-h-[1rem] w-px flex-1 bg-border-strong" aria-hidden />
                ) : null}
              </div>
              <article
                className={cn(
                  "rounded-xl border border-border-strong bg-panel px-3 py-3 shadow-sm sm:rounded-2xl sm:px-4 sm:py-4",
                )}
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-snug text-foreground">
                      {entry.action}
                    </h3>
                    <p className="mt-1 text-xs text-muted sm:text-sm">
                      {entry.actorName}
                    </p>
                  </div>
                  <time
                    className="shrink-0 font-mono text-[11px] leading-snug text-muted lg:text-right lg:text-xs"
                    dateTime={entry.rawCreatedAt ?? undefined}
                  >
                    {entry.createdAt}
                  </time>
                </div>
                {entry.details ? (
                  <p className="mt-2 border-t border-border pt-2 text-sm leading-relaxed text-foreground">
                    {entry.details}
                  </p>
                ) : null}
                {entry.change?.before || entry.change?.after ? (
                  <div className="mt-3 grid gap-3 rounded-lg border border-border bg-panel-muted px-3 py-3 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        Before
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {entry.change?.before ?? "Not recorded"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                        After
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {entry.change?.after ?? "Not recorded"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-foreground">
          No log entries match the current filters.
        </div>
      )}
    </section>
  );
}
