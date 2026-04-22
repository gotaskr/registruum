import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentProfile } from "@/features/auth/api/profiles";
import { getHistoryDetailForCurrentUser } from "@/features/history/api/history";
import { HistoryDetailScreen } from "@/features/history/ui/history-detail-screen";
import { getSpacesForUser } from "@/features/spaces/api/spaces";

type HistoryDetailPageProps = Readonly<{
  params: Promise<{ historyId: string }>;
}>;

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const { historyId } = await params;
  const [profile, spaces, detail] = await Promise.all([
    getCurrentProfile(),
    getSpacesForUser(),
    getHistoryDetailForCurrentUser(historyId),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <DashboardShell spaces={spaces} profile={profile} sidebar={null}>
      <HistoryDetailScreen detail={detail} />
    </DashboardShell>
  );
}
