import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import Subscription from "@/models/Subscription.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { subscriptionCreateSchema } from "@/validators/admin.js";
import { createSubscription } from "@/services/subscriptionService.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError, AppError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const filter = {};
    if (userId) filter.user = userId;
    if (status) filter.cachedStatus = status;
    const items = await Subscription.find(filter)
      .populate("user", "name email")
      .populate("plan")
      .sort({ endDate: -1 })
      .lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const body = await request.json();
    const parsed = subscriptionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const member = await User.findById(parsed.data.userId);
    if (!member || member.role !== ROLES.CLIENT) {
      throw new AppError("User must be a client member", 400);
    }
    const sub = await createSubscription({
      userId: member._id,
      planId: parsed.data.planId,
      startDate: parsed.data.startDate,
      actorId: actor._id,
    });
    await logActivity({
      actorId: actor._id,
      action: "subscription.create",
      resource: "subscription",
      resourceId: sub._id,
      metadata: { userId: member._id.toString(), planId: parsed.data.planId },
    });
    const full = await Subscription.findById(sub._id).populate("plan").populate("user", "name email").lean();
    return Response.json({ subscription: full }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
