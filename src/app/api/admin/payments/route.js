import { connectDB } from "@/lib/db.js";
import Payment from "@/models/Payment.js";
import User from "@/models/User.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { paymentCreateSchema } from "@/validators/admin.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError, AppError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();
    const filter = {};
    if (userId) filter.user = userId;
    if (status && ["paid", "pending"].includes(status)) filter.status = status;
    const query = Payment.find(filter)
      .populate("user", "name email")
      .populate("subscription")
      .populate("recordedBy", "name email")
      .sort({ paidAt: -1 })
      .limit(500);
    const items = await query.lean();
    let out = items;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      out = items.filter((p) => rx.test(p.user?.name || "") || rx.test(p.user?.email || ""));
    }
    return Response.json({ items: out });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const body = await request.json();
    const parsed = paymentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const member = await User.findById(parsed.data.userId);
    if (!member) throw new AppError("User not found", 404);

    const pay = await Payment.create({
      user: parsed.data.userId,
      subscription: parsed.data.subscriptionId || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency ?? "USD",
      status: parsed.data.status ?? "paid",
      method: "manual",
      provider: "manual",
      recordedBy: actor._id,
      note: parsed.data.note ?? "",
      paidAt: parsed.data.paidAt ?? new Date(),
    });

    await logActivity({
      actorId: actor._id,
      action: "payment.create",
      resource: "payment",
      resourceId: pay._id,
      metadata: { amount: pay.amount, userId: member._id.toString() },
    });

    const full = await Payment.findById(pay._id)
      .populate("user", "name email")
      .populate("subscription")
      .populate("recordedBy", "name email")
      .lean();

    return Response.json({ payment: full }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
