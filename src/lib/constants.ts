import type { WorkOrderModule } from "@/types/work-order";

export const DEFAULT_MODULE: WorkOrderModule = "overview";

export const WORK_ORDER_MODULES: ReadonlyArray<{
  slug: WorkOrderModule;
  label: string;
}> = [
  { slug: "overview", label: "Overview" },
  { slug: "chat", label: "Chat" },
  { slug: "documents", label: "Documents" },
  { slug: "members", label: "Members" },
  { slug: "logs", label: "Logs" },
  { slug: "settings", label: "Settings" },
];

export function isWorkOrderModule(value: string): value is WorkOrderModule {
  return WORK_ORDER_MODULES.some((module) => module.slug === value);
}
