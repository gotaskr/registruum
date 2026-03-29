import { redirect } from "next/navigation";
import { getWorkOrderModuleHref } from "@/lib/route-utils";

type WorkOrderPageProps = Readonly<{
  params: Promise<{
    spaceId: string;
    workOrderId: string;
  }>;
}>;

export default async function WorkOrderPage({ params }: WorkOrderPageProps) {
  const { spaceId, workOrderId } = await params;

  redirect(getWorkOrderModuleHref(spaceId, workOrderId, "overview"));
}
