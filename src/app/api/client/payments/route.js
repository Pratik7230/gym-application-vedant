import { connectDB } from "@/lib/db.js";
import Payment from "@/models/Payment.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request, [ROLES.CLIENT]);
    await connectDB();
    const items = await Payment.find({ user: user._id })
      .sort({ paidAt: -1 })
      .limit(100)
      .lean();
    return Response.json({ items });
  } catch (e) {
    return jsonError(e);
  }
}
