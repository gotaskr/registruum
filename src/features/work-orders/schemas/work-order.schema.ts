import { z } from "zod";

export const workOrderStatusSchema = z.enum([
  "open",
  "in_progress",
  "on_hold",
  "completed",
  "archived",
]);

export const workOrderPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const workOrderSubjectTypeSchema = z.enum([
  "issue",
  "maintenance",
  "inspection",
  "project",
  "emergency",
]);

const nullableTrimmedText = z
  .string()
  .trim()
  .max(5000)
  .transform((value) => (value.length > 0 ? value : null));

const nullableShortText = z
  .string()
  .trim()
  .max(255)
  .transform((value) => (value.length > 0 ? value : null));

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

const nullableCurrentOrFutureDate = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Invalid expiration date.",
  )
  .transform((value) => (value.length > 0 ? value : null))
  .refine(
    (value) => value === null || value >= getTodayDateValue(),
    "Expiration date cannot be in the past.",
  );

const requiredCurrentOrFutureDate = z
  .string()
  .trim()
  .min(1, "Expiration date is required.")
  .refine(
    (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Invalid expiration date.",
  )
  .refine(
    (value) => value >= getTodayDateValue(),
    "Expiration date cannot be in the past.",
  );

export const createWorkOrderSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(160),
  subjectType: workOrderSubjectTypeSchema.default("issue"),
  subject: nullableShortText,
  locationLabel: nullableShortText,
  unitLabel: nullableShortText,
  description: nullableTrimmedText,
  noExpiration: z.boolean().default(false),
  expirationAt: nullableCurrentOrFutureDate,
}).superRefine((value, context) => {
  if (!value.noExpiration && !value.expirationAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expirationAt"],
      message: "Expiration date is required.",
    });
  }
});

export const updateWorkOrderSchema = z.object({
  workOrderId: z.string().uuid("Invalid work order id."),
  spaceId: z.string().uuid("Invalid space id."),
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(160),
  subjectType: workOrderSubjectTypeSchema.default("issue"),
  subject: nullableShortText,
  locationLabel: nullableShortText,
  unitLabel: nullableShortText,
  description: nullableTrimmedText,
  priority: workOrderPrioritySchema.default("medium"),
  startDate: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Invalid start date.",
    )
    .transform((value) => (value.length > 0 ? value : null)),
  dueDate: nullableCurrentOrFutureDate,
  status: workOrderStatusSchema,
  ownerUserId: z.string().uuid("Invalid owner."),
  vendorName: nullableShortText,
  autoSaveChatAttachments: z.boolean().default(true),
  allowDocumentDeletionInProgress: z.boolean().default(true),
  lockDocumentsOnCompleted: z.boolean().default(true),
  editReason: z
    .string()
    .trim()
    .max(500, "Edit reason is too long.")
    .transform((value) => (value.length > 0 ? value : null)),
  isPostedToJobMarket: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.startDate && value.dueDate && value.startDate > value.dueDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueDate"],
      message: "Due date must be on or after the start date.",
    });
  }
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
