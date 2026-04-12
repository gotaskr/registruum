import { notFound } from "next/navigation";
import { getMobileArchivedWorkOrderDetailsData } from "@/features/mobile/api/mobile-work-orders";
import {
  getMobileArchiveHref,
  getMobileArchiveRecordHref,
  type MobileWorkOrderTab,
} from "@/features/mobile/lib/routes";
import { MobileWorkOrderScreen } from "@/features/mobile/work-orders/ui/mobile-work-order-screen";

type MobileArchivedWorkOrderPageProps = Readonly<{
  params: Promise<{
    archivedWorkOrderId: string;
    tab: string;
  }>;
}>;

function normalizeTab(tab: string): MobileWorkOrderTab | null {
  if (tab === "overview" || tab === "chat" || tab === "documents" || tab === "logs") {
    return tab;
  }

  return null;
}

export default async function MobileArchivedWorkOrderPage({
  params,
}: MobileArchivedWorkOrderPageProps) {
  const { archivedWorkOrderId, tab } = await params;
  const currentTab = normalizeTab(tab);

  if (!currentTab) {
    notFound();
  }

  const data = await getMobileArchivedWorkOrderDetailsData(archivedWorkOrderId);

  if (!data) {
    notFound();
  }

  return (
    <MobileWorkOrderScreen
      data={data}
      currentTab={currentTab}
      backHref={getMobileArchiveHref()}
      buildTabHref={(nextTab) => getMobileArchiveRecordHref(archivedWorkOrderId, nextTab)}
    />
  );
}
