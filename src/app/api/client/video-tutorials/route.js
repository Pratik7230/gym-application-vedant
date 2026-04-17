import { connectDB } from "@/lib/db.js";
import { jsonError } from "@/lib/errors.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import VideoTutorial from "@/models/VideoTutorial.js";

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.CLIENT]);
    await connectDB();

    const items = await VideoTutorial.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}
