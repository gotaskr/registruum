import { z } from "zod";

export const createWorkOrderMessageSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  body: z.string().trim().max(4000, "Message is too long."),
});

export type CreateWorkOrderMessageInput = z.infer<
  typeof createWorkOrderMessageSchema
>;
