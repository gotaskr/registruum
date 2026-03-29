import type { Member } from "@/types/member";

export type SpaceOverviewMember = Member &
  Readonly<{
    workOrderTitles: string[];
  }>;
