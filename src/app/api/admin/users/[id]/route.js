import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import { requireAuth } from "@/lib/auth/session.js";
import { ROLES } from "@/constants/roles.js";
import { adminUpdateUserSchema } from "@/validators/admin.js";
import { logActivity } from "@/services/activityLogService.js";
import { jsonError, AppError, ErrorCodes } from "@/lib/errors.js";

export async function GET(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    await connectDB();
    const id = (await params).id;
    const u = await User.findById(id).select("-passwordHash").populate("trainer", "name email").lean();
    if (!u) throw new AppError("Not found", 404, ErrorCodes.NOT_FOUND);
    return Response.json({ user: u });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;
    const body = await request.json();
    const parsed = adminUpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const u = await User.findById(id);
    if (!u) throw new AppError("Not found", 404, ErrorCodes.NOT_FOUND);

    const data = parsed.data;
    if (data.name !== undefined) u.name = data.name;
    if (data.phone !== undefined) u.phone = data.phone;
    if (data.isActive !== undefined) u.isActive = data.isActive;
    if (data.role !== undefined) u.role = data.role;
    if (data.trainer !== undefined) {
      if (data.trainer) {
        const tr = await User.findById(data.trainer);
        if (!tr || tr.role !== ROLES.TRAINER) throw new AppError("Invalid trainer", 400);
        u.trainer = data.trainer;
      } else {
        u.trainer = null;
      }
    }

    if (data.role !== undefined && data.role !== ROLES.CLIENT) {
      u.trainer = null;
    }

    await u.save();

    await logActivity({
      actorId: actor._id,
      action: "user.update",
      resource: "user",
      resourceId: u._id,
      metadata: data,
    });

    return Response.json({
      user: {
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        phone: u.phone,
        trainer: u.trainer?.toString() ?? null,
        isActive: u.isActive,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: actor } = await requireAuth(request, [ROLES.ADMIN]);
    const id = (await params).id;
    await connectDB();
    const u = await User.findById(id);
    if (!u) throw new AppError("Not found", 404, ErrorCodes.NOT_FOUND);
    if (u._id.equals(actor._id)) throw new AppError("Cannot deactivate yourself", 400);
    u.isActive = false;
    await u.save();

    await logActivity({
      actorId: actor._id,
      action: "user.deactivate",
      resource: "user",
      resourceId: u._id,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
