"use client";

import { useMemo, useState } from "react";
import type { LogEntry } from "@/types/log";

type LogListProps = Readonly<{
  logs: LogEntry[];
}>;

export function LogList({ logs }: LogListProps) {
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");

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

  return (
    <section className="px-6 py-4">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border bg-panel px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Audit View
          </p>
          <p className="mt-2 text-sm text-muted">
            Review who changed what on this work order and narrow the timeline when needed.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Actor
            </span>
            <select
              value={actorFilter}
              onChange={(event) => setActorFilter(event.target.value)}
              className="h-10 min-w-40 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
            >
              <option value="all">All actors</option>
              {actorOptions.map((actorName) => (
                <option key={actorName} value={actorName}>
                  {actorName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Action
            </span>
            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="h-10 min-w-48 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
            >
              <option value="all">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Search
            </span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Find a person or change"
              className="h-10 min-w-56 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {filteredLogs.length} of {logs.length} entries
        </p>
        {actorFilter !== "all" || actionFilter !== "all" || searchValue.trim().length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setActorFilter("all");
              setActionFilter("all");
              setSearchValue("");
            }}
            className="text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredLogs.length > 0 ? (
        filteredLogs.map((entry, index) => (
          <div key={entry.id} className="grid grid-cols-[1rem_1fr] gap-4 pb-6">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4d8dff]" />
              {index < filteredLogs.length - 1 ? (
                <span className="mt-2 h-full w-px bg-border" />
              ) : null}
            </div>
            <div className="rounded-2xl border border-border bg-panel px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.action}</p>
                  <p className="mt-1 text-sm text-muted">{entry.actorName}</p>
                </div>
                <p className="font-mono text-xs text-muted">{entry.createdAt}</p>
              </div>
              {entry.details ? (
                <p className="mt-1 text-sm text-muted">{entry.details}</p>
              ) : null}
              {entry.change?.before || entry.change?.after ? (
                <div className="mt-3 grid gap-3 rounded-xl border border-border bg-background px-3 py-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      Before
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {entry.change?.before ?? "Not recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      After
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {entry.change?.after ?? "Not recorded"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
          No log entries match the current filters.
        </div>
      )}
    </section>
  );
}
