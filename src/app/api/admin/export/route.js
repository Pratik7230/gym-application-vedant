import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import Payment from "@/models/Payment.js";
import Subscription from "@/models/Subscription.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { jsonError } from "@/lib/errors.js";

function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request) {
  try {
    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "users";

    if (type === "users") {
      const rows = await User.find({})
        .select("email name role phone isActive createdAt")
        .sort({ createdAt: -1 })
        .lean();
      const header = ["email", "name", "role", "phone", "isActive", "createdAt"];
      const lines = [
        header.join(","),
        ...rows.map((r) =>
          [r.email, r.name, r.role, r.phone, r.isActive, r.createdAt?.toISOString()]
            .map(csvEscape)
            .join(",")
        ),
      ];
      return new Response(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="users.csv"',
        },
      });
    }

    if (type === "payments") {
      const rows = await Payment.find({})
        .populate("user", "email name")
        .sort({ paidAt: -1 })
        .lean();
      const header = ["paidAt", "amount", "currency", "status", "userEmail", "userName", "note"];
      const lines = [
        header.join(","),
        ...rows.map((r) =>
          [
            r.paidAt?.toISOString(),
            r.amount,
            r.currency,
            r.status,
            r.user?.email,
            r.user?.name,
            r.note,
          ]
            .map(csvEscape)
            .join(",")
        ),
      ];
      return new Response(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="payments.csv"',
        },
      });
    }

    if (type === "subscriptions") {
      const rows = await Subscription.find({})
        .populate("user", "email name")
        .populate("plan", "name price")
        .sort({ endDate: -1 })
        .lean();
      const header = ["userEmail", "userName", "planName", "startDate", "endDate", "status"];
      const lines = [
        header.join(","),
        ...rows.map((r) =>
          [
            r.user?.email,
            r.user?.name,
            r.plan?.name,
            r.startDate?.toISOString(),
            r.endDate?.toISOString(),
            r.cachedStatus,
          ]
            .map(csvEscape)
            .join(",")
        ),
      ];
      return new Response(lines.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="subscriptions.csv"',
        },
      });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (e) {
    return jsonError(e);
  }
}
