import { z } from "zod";

export const updateNotificationsSchema = z.object({
  inAppNotificationsEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  mentionsOnlyMode: z.boolean(),
});
