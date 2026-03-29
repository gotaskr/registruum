import { z } from "zod";

const workOrderMemberRoleSchema = z.enum([
  "manager",
  "contractor",
  "member",
  "viewer",
]);

export const assignWorkOrderMemberSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  userId: z.string().uuid("Invalid member id."),
});

export const createWorkOrderInviteSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
});

export const previewWorkOrderMemberByCodeSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  userCode: z
    .string()
    .trim()
    .min(6, "Enter a valid 6-character member code.")
    .max(7, "Enter a valid 6-character member code."),
});

export const addWorkOrderMemberByCodeSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  userCode: z
    .string()
    .trim()
    .min(6, "Enter a valid 6-character member code.")
    .max(7, "Enter a valid 6-character member code."),
});

export const cancelWorkOrderInviteSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  inviteId: z.string().uuid("Invalid invite id."),
});

export const removeWorkOrderMemberSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  membershipId: z.string().uuid("Invalid membership id."),
});

export const updateWorkOrderMemberRoleSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  membershipId: z.string().uuid("Invalid membership id."),
  memberUserId: z.string().uuid("Invalid member id."),
  role: workOrderMemberRoleSchema,
});
