import { connectDB } from "@/lib/db.js";
import Subscription from "@/models/Subscription.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError, AppError } from "@/lib/errors.js";
import { computeCachedStatus } from "@/lib/subscription-status.js";
import { z } from "zod";

const patchSchema = z.object({
  endDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const sub = await Subscription.findById(id);
    if (!sub) throw new AppError("Not found", 404);
    if (parsed.data.endDate) sub.endDate = parsed.data.endDate;
    if (parsed.data.startDate) sub.startDate = parsed.data.startDate;
    sub.cachedStatus = computeCachedStatus(sub.endDate);
    await sub.save();
    await logActivity({
      actorId: actor._id,
      action: "subscription.update",
      resource: "subscription",
      resourceId: sub._id,
    });
    const full = await Subscription.findById(sub._id).populate("plan").populate("user", "name email").lean();
    return Response.json({ subscription: full });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;
    await connectDB();
    const sub = await Subscription.findByIdAndDelete(id);
    if (!sub) throw new AppError("Not found", 404);
    await logActivity({
      actorId: actor._id,
      action: "subscription.delete",
      resource: "subscription",
      resourceId: id,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
