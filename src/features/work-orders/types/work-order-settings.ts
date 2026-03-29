import type { WorkOrderPermissionMatrix } from "@/features/permissions/lib/work-order-permission-definitions";

export type WorkOrderOwnerOption = Readonly<{
  id: string;
  name: string;
  email: string | null;
}>;

export type WorkOrderSettingsData = Readonly<{
  ownerOptions: WorkOrderOwnerOption[];
  permissionMatrix: WorkOrderPermissionMatrix;
}>;
