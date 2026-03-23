import { connectDB } from "@/lib/db.js";
import WorkoutPlan from "@/models/WorkoutPlan.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.CLIENT]);
    await connectDB();
    const items = await WorkoutPlan.find({ client: user._id })
      .populate("trainer", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}
