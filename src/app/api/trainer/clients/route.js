import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.TRAINER]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const filter = { role: ROLES.CLIENT, trainer: user._id, isActive: true };
    if (q) {
      filter.$or = [
        { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }
    const items = await User.find(filter).select("-passwordHash").sort({ name: 1 }).lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}
