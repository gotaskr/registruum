import type { LogEntry } from "@/types/log";

export type WorkOrderOverviewPhoto = Readonly<{
  id: string;
  title: string;
  previewUrl: string;
}>;

export type WorkOrderOverviewData = Readonly<{
  createdByName: string;
  memberCount: number;
  documentCount: number;
  photoCount: number;
  photos: WorkOrderOverviewPhoto[];
  activityCount: number;
  recentLogs: LogEntry[];
}>;
