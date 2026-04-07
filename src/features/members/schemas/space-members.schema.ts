import { z } from "zod";

const roleSchema = z.enum([
  "admin",
  "operations_manager",
  "manager",
  "field_lead_superintendent",
]);

const workOrderIdsSchema = z
  .array(z.string().uuid("Invalid work order id."))
  .default([]);

export const createEmailInviteSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  email: z.string().trim().email("Enter a valid email address."),
  role: roleSchema,
  message: z
    .string()
    .trim()
    .max(280, "Message is too long.")
    .transform((value) => (value.length > 0 ? value : null)),
  workOrderIds: workOrderIdsSchema,
});

export const previewMemberByCodeSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  userCode: z
    .string()
    .trim()
    .min(6, "Enter a valid user tag.")
    .max(7, "Enter a valid user tag."),
});

export const addMemberByCodeSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  userCode: z
    .string()
    .trim()
    .min(6, "Enter a valid user tag.")
    .max(7, "Enter a valid user tag."),
  role: roleSchema,
  workOrderIds: workOrderIdsSchema,
});

export const updateSpaceMemberRoleSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  membershipId: z.string().uuid("Invalid membership id."),
  role: roleSchema,
});

export const updateSpaceMemberAssignmentsSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  membershipId: z.string().uuid("Invalid membership id."),
  workOrderIds: workOrderIdsSchema,
});

export const removeSpaceMemberSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  membershipId: z.string().uuid("Invalid membership id."),
});

export const updateInviteStatusSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  inviteId: z.string().uuid("Invalid invite id."),
});

export const regenerateSpaceInviteSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
});
