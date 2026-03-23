import { z } from "zod";

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
  phone: z.string().optional(),
  role: z.enum(["admin", "trainer", "client"]),
  trainer: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "trainer", "client"]).optional(),
  trainer: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const planSchema = z.object({
  name: z.string().min(1),
  billingPeriod: z.enum(["monthly", "yearly", "custom"]),
  durationDays: z.number().min(1),
  price: z.number().min(0),
  currency: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const subscriptionCreateSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.coerce.date(),
});

export const paymentCreateSchema = z.object({
  userId: z.string().min(1),
  subscriptionId: z.string().optional().nullable(),
  amount: z.number().min(0),
  currency: z.string().optional(),
  status: z.enum(["paid", "pending"]).optional(),
  note: z.string().optional(),
  paidAt: z.coerce.date().optional(),
});

export const attendanceManualSchema = z.object({
  userId: z.string().min(1),
  date: z.coerce.date(),
});
