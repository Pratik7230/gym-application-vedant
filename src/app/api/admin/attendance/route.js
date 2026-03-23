import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import Attendance from "@/models/Attendance.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { attendanceManualSchema } from "@/validators/admin.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError, AppError } from "@/lib/errors.js";

function dayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const filter = {};
    if (userId) filter.user = userId;
    const items = await Attendance.find(filter)
      .populate("user", "name email")
      .sort({ date: -1 })
      .limit(200)
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
    const parsed = attendanceManualSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const member = await User.findById(parsed.data.userId);
    if (!member || member.role !== ROLES.CLIENT) throw new AppError("Invalid client", 400);
    const day = dayStart(parsed.data.date);
    const existing = await Attendance.findOne({ user: member._id, date: day });
    if (existing) {
      return Response.json({ attendance: existing, message: "Already recorded" });
    }
    const att = await Attendance.create({
      user: member._id,
      date: day,
      checkedInAt: new Date(),
      source: "manual",
    });
    await logActivity({
      actorId: actor._id,
      action: "attendance.create",
      resource: "attendance",
      resourceId: att._id,
      metadata: { userId: member._id.toString() },
    });
    return Response.json({ attendance: att }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
