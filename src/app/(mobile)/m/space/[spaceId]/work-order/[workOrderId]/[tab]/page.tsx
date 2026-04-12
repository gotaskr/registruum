import { notFound } from "next/navigation";
import { getMobileWorkOrderDetailsData } from "@/features/mobile/api/mobile-work-orders";
import {
  getMobileSpaceHref,
  getMobileWorkOrderHref,
  type MobileWorkOrderTab,
} from "@/features/mobile/lib/routes";
import { MobileWorkOrderScreen } from "@/features/mobile/work-orders/ui/mobile-work-order-screen";

type MobileWorkOrderPageProps = Readonly<{
  params: Promise<{
    spaceId: string;
    workOrderId: string;
    tab: string;
  }>;
}>;

function normalizeTab(tab: string): MobileWorkOrderTab | null {
  if (tab === "overview" || tab === "chat" || tab === "documents" || tab === "logs") {
    return tab;
  }

  return null;
}

export default async function MobileWorkOrderPage({ params }: MobileWorkOrderPageProps) {
  const { spaceId, workOrderId, tab } = await params;
  const currentTab = normalizeTab(tab);

  if (!currentTab) {
    notFound();
  }

  const data = await getMobileWorkOrderDetailsData(spaceId, workOrderId);

  return (
    <MobileWorkOrderScreen
      data={data}
      currentTab={currentTab}
      backHref={getMobileSpaceHref(spaceId)}
      buildTabHref={(nextTab) => getMobileWorkOrderHref(spaceId, workOrderId, nextTab)}
    />
  );
}
