export type WorkOrderActionState = Readonly<{
  error?: string;
  success?: string;
}>;

export const initialWorkOrderActionState: WorkOrderActionState = {};
