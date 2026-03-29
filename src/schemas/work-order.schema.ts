import { z } from "zod";

export const workOrderStatusSchema = z.enum([
  "open",
  "in_progress",
  "completed",
  "archived",
]);

export const workOrderModuleSchema = z.enum([
  "overview",
  "chat",
  "documents",
  "members",
  "logs",
  "settings",
]);

export const workOrderSchema = z.object({
  id: z.string().min(1),
  spaceId: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1),
  status: workOrderStatusSchema,
  summary: z.string().min(1),
});

export type WorkOrderInput = z.infer<typeof workOrderSchema>;
