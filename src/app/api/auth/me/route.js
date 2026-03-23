import { requireAuth } from "@/lib/auth/session.js";
import { jsonError } from "@/lib/errors.js";

export async function GET(request) {
  try {
    const { user } = await requireAuth(request);
    return Response.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        trainer: user.trainer ? user.trainer.toString() : null,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
