import { z } from "zod";
import { spaceTypeOptions } from "@/features/spaces/lib/space-types";

const spaceTypeValues = spaceTypeOptions.map((option) => option.value) as [
  (typeof spaceTypeOptions)[number]["value"],
  ...(typeof spaceTypeOptions)[number]["value"][],
];

const spaceNameSchema = z
  .string()
  .trim()
  .min(2, "Space name must be at least 2 characters.")
  .max(120, "Space name must be 120 characters or less.");

export const createSpaceSchema = z.object({
  name: spaceNameSchema,
  spaceType: z.enum(spaceTypeValues, {
    message: "Select a space type.",
  }),
  address: z
    .string()
    .trim()
    .max(200, "Address must be 200 characters or less.")
    .optional()
    .transform((value) => value ?? ""),
});

export const updateSpaceSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
}).merge(createSpaceSchema);

export const deleteSpaceSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type DeleteSpaceInput = z.infer<typeof deleteSpaceSchema>;
