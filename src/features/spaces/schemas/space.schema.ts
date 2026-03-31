import { z } from "zod";

const spaceNameSchema = z
  .string()
  .trim()
  .min(2, "Space name must be at least 2 characters.")
  .max(120, "Space name must be 120 characters or less.");

export const createSpaceSchema = z.object({
  name: spaceNameSchema,
  address: z
    .string()
    .trim()
    .max(200, "Address must be 200 characters or less.")
    .optional()
    .transform((value) => value ?? ""),
});

export const renameSpaceSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  name: spaceNameSchema,
});

export const deleteSpaceSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type RenameSpaceInput = z.infer<typeof renameSpaceSchema>;
export type DeleteSpaceInput = z.infer<typeof deleteSpaceSchema>;
