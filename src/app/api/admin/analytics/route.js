import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import Payment from "@/models/Payment.js";
import Subscription from "@/models/Subscription.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalMembers, activeSubscriptions, revenueAgg, revenueMonth] = await Promise.all([
      User.countDocuments({ role: ROLES.CLIENT, isActive: true }),
      Subscription.countDocuments({
        cachedStatus: "active",
      }),
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: { status: "paid", paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const monthRevenue = revenueMonth[0]?.total ?? 0;

    return Response.json({
      totalMembers,
      activeSubscriptions,
      totalRevenue,
      monthRevenue,
    });
  } catch (e) {
    return jsonError(e);
  }
}
