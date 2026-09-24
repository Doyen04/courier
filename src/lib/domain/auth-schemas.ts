import { z } from "zod";

export const registerAccountSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(12).max(128),
}).strict();

export type RegisterAccountInput = z.infer<typeof registerAccountSchema>;

export const emailAddressSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
}).strict();

export const authTokenSchema = z.object({
  token: z.string().min(32).max(100),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(100),
  password: z.string().min(12).max(128),
}).strict();

export type EmailAddressInput = z.infer<typeof emailAddressSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
