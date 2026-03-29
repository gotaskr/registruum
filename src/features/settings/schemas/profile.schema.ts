import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .refine((value) => value === null || z.email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

export const updateProfileIdentitySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(160, "Full name is too long."),
  email: z.email("Enter a valid primary email address."),
  additionalEmails: z
    .array(optionalEmail)
    .transform((value) =>
      value.filter((item): item is string => item !== null),
    ),
  contactInfo: z
    .string()
    .trim()
    .max(500, "Contact info is too long.")
    .transform((value) => (value.length > 0 ? value : null)),
});

export const updateProfileCompanySchema = z
  .object({
    representsCompany: z.boolean(),
    companyName: z
      .string()
      .trim()
      .max(160, "Company name is too long.")
      .transform((value) => (value.length > 0 ? value : null)),
    companyEmail: optionalEmail,
    companyAddress: z
      .string()
      .trim()
      .max(240, "Company address is too long.")
      .transform((value) => (value.length > 0 ? value : null)),
  })
  .superRefine((value, context) => {
    if (value.representsCompany && !value.companyName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["companyName"],
        message: "Company name is required when representing a company.",
      });
    }
  });

export const updateProfileDisplaySchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(160, "Display name is too long."),
});
