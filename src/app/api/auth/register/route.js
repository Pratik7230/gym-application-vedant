import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/validators/auth.js";
import { registerUser } from "@/services/authService.js";
import { setAuthCookies } from "@/lib/auth/cookies.js";
import { AppError, jsonError, ErrorCodes } from "@/lib/errors.js";
import { ROLES } from "@/constants/roles";
import { getAuthRateLimit, getClientIp } from "@/lib/rate-limit.js";

export async function POST(request) {
  try {
    const rl = getAuthRateLimit();
    const ip = getClientIp(request);
    const { success } = await rl.limit(`register:${ip}`);
    if (!success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const count = await User.countDocuments();
    let role = parsed.data.role ?? ROLES.CLIENT;
    if (role !== ROLES.CLIENT) {
      const bootstrap = request.headers.get("x-admin-bootstrap-secret");
      const allow =
        count === 0 ||
        (process.env.ADMIN_BOOTSTRAP_SECRET &&
          bootstrap === process.env.ADMIN_BOOTSTRAP_SECRET);
      if (!allow) {
        throw new AppError("Cannot register this role without authorization", 403, ErrorCodes.FORBIDDEN);
      }
    }

    const { user, access, refresh } = await registerUser({
      ...parsed.data,
      role,
    });

    await setAuthCookies(access, refresh);

    return Response.json({ user }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
