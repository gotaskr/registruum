import { z } from "zod";

const nullableUuid = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .refine((value) => value === null || z.string().uuid().safeParse(value).success, {
    message: "Invalid parent folder.",
  });

export const createDocumentFolderSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  parentFolderId: nullableUuid,
  name: z
    .string()
    .trim()
    .min(2, "Folder name must be at least 2 characters.")
    .max(120, "Folder name is too long."),
});

export const uploadDocumentFilesSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
});

export const createDocumentLinkSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  title: z
    .string()
    .trim()
    .max(160, "Link title is too long.")
    .transform((value) => (value.length > 0 ? value : null)),
  url: z.string().trim().url("Enter a valid link."),
});

export const deleteDocumentSchema = z.object({
  spaceId: z.string().uuid("Invalid space id."),
  workOrderId: z.string().uuid("Invalid work order id."),
  documentId: z.string().uuid("Invalid document id."),
});

export type CreateDocumentFolderInput = z.infer<typeof createDocumentFolderSchema>;
export type UploadDocumentFilesInput = z.infer<typeof uploadDocumentFilesSchema>;
export type CreateDocumentLinkInput = z.infer<typeof createDocumentLinkSchema>;
export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
