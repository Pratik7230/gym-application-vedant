import { connectDB } from "@/lib/db.js";
import Attendance from "@/models/Attendance.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.CLIENT]);
    await connectDB();
    const items = await Attendance.find({ user: user._id })
      .sort({ date: -1 })
      .limit(90)
      .lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}
