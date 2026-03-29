"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWorkOrderLocation } from "@/lib/utils";
import type { LogEntry } from "@/types/log";
import type { WorkOrder } from "@/types/work-order";

type LogAuditExportButtonProps = Readonly<{
  workOrder: WorkOrder;
  logs: LogEntry[];
}>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildExportReference(workOrder: WorkOrder, logs: LogEntry[]) {
  const input = `${workOrder.id}:${logs
    .map((entry) => `${entry.id}:${entry.rawCreatedAt ?? entry.createdAt}`)
    .join("|")}`;
  let hash = 5381;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }

  return `AUD-${Math.abs(hash >>> 0).toString(16).toUpperCase()}`;
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}

function buildAuditHtmlReport(input: Readonly<{
  workOrder: WorkOrder;
  logs: LogEntry[];
  exportReference: string;
}>) {
  const { workOrder, logs, exportReference } = input;
  const locationLabel = formatWorkOrderLocation(
    workOrder.locationLabel,
    workOrder.unitLabel,
  );
  const renderedLogs =
    logs.length > 0
      ? logs
          .map(
            (entry) => `
              <article class="log-entry">
                <div class="log-header">
                  <h3>${escapeHtml(entry.action)}</h3>
                  <p>${escapeHtml(entry.createdAt)}</p>
                </div>
                <p class="actor">${escapeHtml(entry.actorName)}</p>
                ${
                  entry.details
                    ? `<p class="details">${escapeHtml(entry.details)}</p>`
                    : ""
                }
                ${
                  entry.change?.before || entry.change?.after
                    ? `
                      <div class="change-grid">
                        <div>
                          <p class="change-label">Before</p>
                          <p class="change-value">${escapeHtml(entry.change?.before ?? "Not recorded")}</p>
                        </div>
                        <div>
                          <p class="change-label">After</p>
                          <p class="change-value">${escapeHtml(entry.change?.after ?? "Not recorded")}</p>
                        </div>
                      </div>
                    `
                    : ""
                }
              </article>
            `,
          )
          .join("")
      : `<div class="empty-state">No activity has been recorded for this work order yet.</div>`;
  const documentTitle = `${workOrder.title} Audit Log`;

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(documentTitle)}</title>
        <style>
          :root {
            color-scheme: light;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #f8fafc;
            color: #0f172a;
          }
          .page {
            padding: 32px;
          }
          .toolbar {
            display: flex;
            justify-content: flex-end;
            max-width: 960px;
            margin: 0 auto 16px;
          }
          .toolbar button {
            height: 40px;
            padding: 0 16px;
            border: 1px solid #dbe4f0;
            border-radius: 999px;
            background: #ffffff;
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }
          .report {
            max-width: 960px;
            margin: 0 auto;
            border: 1px solid #dbe4f0;
            border-radius: 20px;
            background: #ffffff;
            overflow: hidden;
          }
          .header {
            padding: 28px 32px 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          .eyebrow {
            margin: 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: #64748b;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-start;
            margin-top: 16px;
          }
          h1 {
            margin: 0;
            font-size: 32px;
            line-height: 1.1;
          }
          .meta {
            margin-top: 10px;
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
          }
          .generated {
            text-align: right;
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
          }
          .reference {
            margin-top: 6px;
            font-family: "Consolas", "SFMono-Regular", monospace;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          .content {
            padding: 24px 32px 32px;
          }
          .log-entry {
            padding: 18px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .log-entry:last-child {
            border-bottom: none;
          }
          .log-header {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: baseline;
          }
          .log-header h3 {
            margin: 0;
            font-size: 17px;
            font-weight: 600;
            color: #0f172a;
          }
          .log-header p {
            margin: 0;
            font-size: 13px;
            color: #64748b;
            white-space: nowrap;
          }
          .actor,
          .details {
            margin: 8px 0 0;
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
          }
          .change-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            margin-top: 12px;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            background: #f8fafc;
          }
          .change-label {
            margin: 0;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #64748b;
          }
          .change-value {
            margin: 8px 0 0;
            font-size: 14px;
            color: #0f172a;
          }
          .empty-state {
            padding: 24px;
            border: 1px dashed #cbd5e1;
            border-radius: 16px;
            color: #64748b;
            font-size: 14px;
          }
          @media print {
            body {
              background: #ffffff;
            }
            .page {
              padding: 0;
            }
            .toolbar {
              display: none;
            }
            .report {
              border: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="toolbar">
            <button type="button" onclick="window.print()">Save as PDF</button>
          </div>
          <section class="report">
            <header class="header">
              <p class="eyebrow">Audit Export</p>
              <div class="title-row">
                <div>
                  <h1>${escapeHtml(workOrder.title)}</h1>
                  <div class="meta">
                    <div>Work Order Log</div>
                    <div>${escapeHtml(locationLabel)}</div>
                    <div>Status: ${escapeHtml(workOrder.status)}</div>
                  </div>
                </div>
                <div class="generated">
                  <div>Generated</div>
                  <div>${escapeHtml(new Date().toLocaleString())}</div>
                  <div class="reference">${escapeHtml(exportReference)}</div>
                </div>
              </div>
            </header>
            <main class="content">
              ${renderedLogs}
            </main>
          </section>
        </div>
        <script>
          window.addEventListener("load", () => {
            window.setTimeout(() => {
              window.print();
            }, 150);
          });
        </script>
      </body>
    </html>`;
}

export function LogAuditExportButton({
  workOrder,
  logs,
}: LogAuditExportButtonProps) {
  const exportReference = buildExportReference(workOrder, logs);

  const handleExport = () => {
    const html = buildAuditHtmlReport({
      workOrder,
      logs,
      exportReference,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const reportUrl = URL.createObjectURL(blob);
    const printWindow = window.open(
      reportUrl,
      "_blank",
      "noopener,noreferrer,width=960,height=720",
    );

    if (!printWindow) {
      URL.revokeObjectURL(reportUrl);
      return;
    }
    printWindow.addEventListener("beforeunload", () => {
      URL.revokeObjectURL(reportUrl);
    });
  };

  const handleCsvExport = () => {
    const rows = [
      ["Export Reference", exportReference],
      ["Work Order", workOrder.title],
      ["Status", workOrder.status],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Timestamp", "Actor", "Action", "Summary", "Before", "After"],
      ...logs.map((entry) => [
        entry.createdAt,
        entry.actorName,
        entry.action,
        entry.details ?? "",
        entry.change?.before ?? "",
        entry.change?.after ?? "",
      ]),
    ];
    const csvContent = rows
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${workOrder.title
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .toLowerCase()}-audit-log.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={handleCsvExport}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="secondary" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
    </div>
  );
}
