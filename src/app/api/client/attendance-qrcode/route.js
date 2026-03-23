import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { signAttendanceToken } from "@/lib/auth/attendance-token.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.CLIENT]);
    const token = await signAttendanceToken(user._id.toString());
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${base.replace(/\/$/, "")}/api/attendance/check-in?token=${encodeURIComponent(token)}`;
    return Response.json({ url, token });
  } catch (e) {
    return jsonError(e);
  }
}
