"use client";

import { useState } from "react";
import { MobileCard } from "@/features/mobile/ui/mobile-primitives";
import type { LogEntry } from "@/types/log";

export function MobileWorkOrderLogsTab({
  logs,
}: Readonly<{
  logs: LogEntry[];
}>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {logs.length > 0 ? (
        logs.map((entry) => {
          const isExpanded = expandedId === entry.id;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              className="block w-full text-left"
            >
              <MobileCard className="relative pl-10">
                <div className="absolute left-9 top-6 h-[calc(100%-3rem)] w-px bg-slate-200" />
                <div className="absolute left-[1.7rem] top-6 h-4 w-4 rounded-full border-[3px] border-[#3566d6] bg-white" />
                <div className="space-y-1 pl-4">
                  <p className="text-[1.15rem] font-semibold text-slate-950">{entry.action}</p>
                  <p className="text-[1.02rem] text-slate-500">
                    {entry.actorName} · {entry.createdAt}
                  </p>
                  {isExpanded ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                      {entry.details ? <p>{entry.details}</p> : null}
                      {entry.change?.before || entry.change?.after ? (
                        <p className="mt-2">
                          Before: {entry.change?.before ?? "Not recorded"} | After: {" "}
                          {entry.change?.after ?? "Not recorded"}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </MobileCard>
            </button>
          );
        })
      ) : (
        <MobileCard className="text-sm text-slate-500">No log entries yet.</MobileCard>
      )}
    </div>
  );
}
