import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { adminCreateUserSchema } from "@/validators/admin.js";
import { hashPassword } from "@/lib/auth/password.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError, AppError } from "@/lib/errors.js";
import { getApiRateLimit, getClientIp } from "@/lib/rate-limit.js";

export async function GET(request) {
  try {
    const rl = getApiRateLimit();
    const { success } = await rl.limit(`api:${getClientIp(request)}`);
    if (!success) return Response.json({ error: "Too many requests" }, { status: 429 });

    await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const filter = {};
    if (q) {
      filter.$or = [
        { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }
    if (role && ["admin", "trainer", "client"].includes(role)) filter.role = role;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .populate("trainer", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return Response.json({ items, total, page, limit });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const body = await request.json();
    const parsed = adminCreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const data = parsed.data;
    const exists = await User.findOne({ email: data.email.toLowerCase() });
    if (exists) throw new AppError("Email already registered", 409);

    if (data.role === ROLES.CLIENT && data.trainer) {
      const tr = await User.findById(data.trainer);
      if (!tr || tr.role !== ROLES.TRAINER) throw new AppError("Invalid trainer", 400);
    }

    const passwordHash = await hashPassword(data.password);
    const created = await User.create({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      phone: data.phone ?? "",
      role: data.role,
      trainer: data.role === ROLES.CLIENT && data.trainer ? data.trainer : null,
      isActive: data.isActive ?? true,
    });

    await logActivity({
      actorId: actor._id,
      action: "user.create",
      resource: "user",
      resourceId: created._id,
      metadata: { email: created.email, role: created.role },
    });

    return Response.json(
      {
        user: {
          id: created._id.toString(),
          email: created.email,
          name: created.name,
          role: created.role,
          phone: created.phone,
          trainer: created.trainer?.toString() ?? null,
          isActive: created.isActive,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return jsonError(e);
  }
}
