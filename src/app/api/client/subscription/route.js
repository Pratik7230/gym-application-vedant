import { connectDB } from "@/lib/db.js";
import Subscription from "@/models/Subscription.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";
import { remainingDays, computeCachedStatus } from "@/lib/subscription-status.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.CLIENT]);
    await connectDB();
    const sub = await Subscription.findOne({ user: user._id })
      .sort({ endDate: -1 })
      .populate("plan")
      .lean();
    if (!sub) {
      return Response.json({ subscription: null, remainingDays: null, status: null });
    }
    const days = remainingDays(sub.endDate);
    const status = computeCachedStatus(sub.endDate);
    return Response.json({
      subscription: sub,
      remainingDays: days,
      status,
    });
  } catch (e) {
    return jsonError(e);
  }
}
