import type { Database } from "@/types/database";
import type { WorkOrderStatus } from "@/types/database";

export type JobMarketPostStatus =
  Database["public"]["Enums"]["job_market_post_status"];

export type JobMarketPostListItem = Readonly<{
  id: string;
  workOrderId: string;
  spaceId: string;
  title: string;
  description: string | null;
  locationLabel: string | null;
  postedAt: string;
  postedAtLabel: string;
  status: JobMarketPostStatus;
  spaceName: string;
  workOrderStatus: WorkOrderStatus;
  priority: string;
  openHref: string;
}>;

export type JobMarketDashboardData = Readonly<{
  totalPosts: number;
  activePosts: number;
  closedPosts: number;
  spacesWithPosts: number;
  posts: JobMarketPostListItem[];
}>;
