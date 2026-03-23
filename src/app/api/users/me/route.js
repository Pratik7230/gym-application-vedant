import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";
import { requireAuth } from "@/lib/auth/session.js";
import { profileUpdateSchema } from "@/validators/client.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    await connectDB();
    const u = await User.findById(user._id).select("-passwordHash").populate("trainer", "name email").lean();
    return Response.json({ user: u });
  } catch (e) {
    return jsonError(e);
  }
}

export async function PATCH(request) {
  try {
    const { user } = await requireAuth(request);
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    await connectDB();
    const u = await User.findById(user._id);
    if (!u) return Response.json({ error: "Not found" }, { status: 404 });
    if (parsed.data.name !== undefined) u.name = parsed.data.name;
    if (parsed.data.phone !== undefined) u.phone = parsed.data.phone;
    if (parsed.data.avatarUrl !== undefined) u.avatarUrl = parsed.data.avatarUrl || "";
    await u.save();
    return Response.json({
      user: {
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        avatarUrl: u.avatarUrl,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
