import { z } from "zod";

export const workoutPlanSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(1).max(200),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        sets: z.number().min(0).optional(),
        reps: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .default([]),
  progressNotes: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().optional(),
  avatarUrl: z.union([z.string().url(), z.literal("")]).optional(),
});
