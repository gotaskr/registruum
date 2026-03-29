type WorkOrderSummaryProps = Readonly<{
  memberCount: number;
  documentCount: number;
  activityCount: number;
}>;

const summaryItems = [
  {
    key: "memberCount",
    label: "Members",
  },
  {
    key: "documentCount",
    label: "Documents",
  },
  {
    key: "activityCount",
    label: "Activity",
  },
] as const;

export function WorkOrderSummary({
  memberCount,
  documentCount,
  activityCount,
}: WorkOrderSummaryProps) {
  const valueByKey = {
    memberCount,
    documentCount,
    activityCount,
  } as const;

  return (
    <section className="grid border-b border-border md:grid-cols-3">
      {summaryItems.map((item, index) => (
        <div
          key={item.key}
          className={[
            "border-b border-border px-6 py-5 md:border-b-0",
            index < summaryItems.length - 1 ? "md:border-r" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">
            {valueByKey[item.key]}
          </p>
        </div>
      ))}
    </section>
  );
}
