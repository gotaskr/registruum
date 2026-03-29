import { z } from "zod";

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export type SignInInput = z.infer<typeof signInSchema>;
