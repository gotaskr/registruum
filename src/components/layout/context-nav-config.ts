import type { LucideIcon } from "lucide-react";
import {
  FileText,
  LayoutDashboard,
  Logs,
  MessageSquareText,
  UsersRound,
} from "lucide-react";
import type { WorkOrderModule } from "@/types/work-order";

/**
 * Same order and labels as the desktop context sidebar work order section and
 * mobile bottom nav. Omit `settings` until that module is ready to surface.
 */
export const WORK_ORDER_CONTEXT_NAV: ReadonlyArray<{
  slug: WorkOrderModule;
  label: string;
  icon: LucideIcon;
}> = [
  { slug: "overview", label: "Overview", icon: LayoutDashboard },
  { slug: "chat", label: "Chats", icon: MessageSquareText },
  { slug: "members", label: "Members", icon: UsersRound },
  { slug: "documents", label: "Documents", icon: FileText },
  { slug: "logs", label: "Logs", icon: Logs },
];
