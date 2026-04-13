import {
  FileText,
  FolderArchive,
  Logs,
  MessageSquareText,
  UsersRound,
} from "lucide-react";

export type ArchiveRecordDetailTab =
  | "overview"
  | "documents"
  | "chat"
  | "members"
  | "logs";

const VALID = new Set<string>([
  "overview",
  "documents",
  "chat",
  "members",
  "logs",
]);

export function parseArchiveRecordTab(raw: string | null): ArchiveRecordDetailTab {
  if (raw && VALID.has(raw)) {
    return raw as ArchiveRecordDetailTab;
  }
  return "overview";
}

export const archiveRecordTabItems: ReadonlyArray<{
  id: ArchiveRecordDetailTab;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "overview", label: "Overview", icon: FolderArchive },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "chat", label: "Chat", icon: MessageSquareText },
  { id: "members", label: "Members", icon: UsersRound },
  { id: "logs", label: "Logs", icon: Logs },
];
