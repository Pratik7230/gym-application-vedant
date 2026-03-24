import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  phone: z.string().optional(),
  role: z.enum(["admin", "trainer", "client"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestSignupOtpSchema = registerSchema;

export const verifySignupOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordWithOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
  newPassword: z.string().min(8),
});
