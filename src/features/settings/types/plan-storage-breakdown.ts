export type PlanStorageBreakdownItem = Readonly<{
  kind: "work_order" | "unassigned";
  id: string;
  primaryLabel: string;
  secondaryLabel: string;
  usedBytes: number;
  usedLabel: string;
  href: string;
}>;
