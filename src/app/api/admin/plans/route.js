import { connectDB } from "@/lib/db.js";
import Plan from "@/models/Plan.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { planSchema } from "@/validators/admin.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError } from "@/lib/errors.js";
import { getApiRateLimit, getClientIp } from "@/lib/rate-limit.js";

export async function GET(request) {
  try {
    const rl = getApiRateLimit();
    const { success } = await rl.limit(`api:${getClientIp(request)}`);
    if (!success) return Response.json({ error: "Too many requests" }, { status: 429 });

    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const filter = {};
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;
    const items = await Plan.find(filter).sort({ createdAt: -1 }).lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const body = await request.json();
    const parsed = planSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const p = await Plan.create({
      ...parsed.data,
      currency: parsed.data.currency ?? "USD",
      isActive: parsed.data.isActive ?? true,
    });
    await logActivity({
      actorId: actor._id,
      action: "plan.create",
      resource: "plan",
      resourceId: p._id,
      metadata: { name: p.name },
    });
    return Response.json({ plan: p }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
