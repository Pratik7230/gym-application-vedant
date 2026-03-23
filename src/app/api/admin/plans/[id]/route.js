import { connectDB } from "@/lib/db.js";
import Plan from "@/models/Plan.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { planSchema } from "@/validators/admin.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError, AppError } from "@/lib/errors.js";

export async function PATCH(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;
    const body = await request.json();
    const parsed = planSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const p = await Plan.findById(id);
    if (!p) throw new AppError("Not found", 404);
    Object.assign(p, parsed.data);
    await p.save();
    await logActivity({
      actorId: actor._id,
      action: "plan.update",
      resource: "plan",
      resourceId: p._id,
      metadata: parsed.data,
    });
    return Response.json({ plan: p });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;
    await connectDB();
    const p = await Plan.findById(id);
    if (!p) throw new AppError("Not found", 404);
    p.isActive = false;
    await p.save();
    await logActivity({
      actorId: actor._id,
      action: "plan.deactivate",
      resource: "plan",
      resourceId: p._id,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
