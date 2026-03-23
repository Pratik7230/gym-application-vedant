import { connectDB } from "@/lib/db.js";
import WorkoutPlan from "@/models/WorkoutPlan.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError, AppError } from "@/lib/errors.js";
import { z } from "zod";

const workoutPatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        sets: z.number().min(0).optional(),
        reps: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  progressNotes: z.string().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request, [ROLES.TRAINER]);
    const id = (await params).id;
    const body = await request.json();
    const parsed = workoutPatchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const plan = await WorkoutPlan.findById(id);
    if (!plan) throw new AppError("Not found", 404);
    if (String(plan.trainer) !== String(user._id)) throw new AppError("Forbidden", 403);
    if (parsed.data.title !== undefined) plan.title = parsed.data.title;
    if (parsed.data.items !== undefined) plan.items = parsed.data.items;
    if (parsed.data.progressNotes !== undefined) plan.progressNotes = parsed.data.progressNotes;
    await plan.save();
    const full = await WorkoutPlan.findById(plan._id).populate("client", "name email").lean();
    return Response.json({ workout: full });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request, [ROLES.TRAINER]);
    const id = (await params).id;
    await connectDB();
    const plan = await WorkoutPlan.findById(id);
    if (!plan) throw new AppError("Not found", 404);
    if (String(plan.trainer) !== String(user._id)) throw new AppError("Forbidden", 403);
    await plan.deleteOne();
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
