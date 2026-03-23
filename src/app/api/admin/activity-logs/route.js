import { connectDB } from "@/lib/db.js";
import ActivityLog from "@/models/ActivityLog.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 30)));
    const [items, total] = await Promise.all([
      ActivityLog.find({})
        .populate("actor", "name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({}),
    ]);
    return Response.json({ items, total, page, limit });
  } catch (e) {
    return jsonError(e);
  }
}
