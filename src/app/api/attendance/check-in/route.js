import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import Attendance from "@/models/Attendance.js";
import { verifyAttendanceToken } from "@/lib/auth/attendance-token.js";
import { jsonError, AppError } from "@/lib/errors.js";

function dayStart(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) throw new AppError("Missing token", 400);
    let userId;
    try {
      userId = await verifyAttendanceToken(token);
    } catch {
      throw new AppError("Invalid or expired token", 400);
    }
    await connectDB();
    const member = await User.findById(userId);
    if (!member || !member.isActive) throw new AppError("Invalid member", 400);
    const today = dayStart(new Date());
    const existing = await Attendance.findOne({ user: userId, date: today });
    if (existing) {
      return Response.json({
        ok: true,
        message: "Already checked in today",
        checkedInAt: existing.checkedInAt,
      });
    }
    const att = await Attendance.create({
      user: userId,
      date: today,
      checkedInAt: new Date(),
      source: "qr",
    });
    return Response.json({
      ok: true,
      message: "Checked in",
      checkedInAt: att.checkedInAt,
    });
  } catch (e) {
    return jsonError(e);
  }
}
