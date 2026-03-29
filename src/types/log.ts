export type LogEntry = Readonly<{
  id: string;
  workOrderId: string;
  actorUserId: string | null;
  actorName: string;
  action: string;
  createdAt: string;
  rawCreatedAt?: string;
  details?: string;
  change?: Readonly<{
    before?: string;
    after?: string;
  }>;
}>;
