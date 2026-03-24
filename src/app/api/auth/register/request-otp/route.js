import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requestSignupOtpSchema } from "@/validators/auth.js";
import { requestSignupOtp } from "@/services/authService.js";
import { AppError, jsonError, ErrorCodes } from "@/lib/errors.js";
import { ROLES } from "@/constants/roles";
import { getAuthRateLimit, getClientIp } from "@/lib/rate-limit.js";

export async function POST(request) {
  try {
    const rl = getAuthRateLimit();
    const ip = getClientIp(request);
    const body = await request.json();
    const email = body?.email ?? "";
    const { success } = await rl.limit(`register-otp:${ip}:${email}`);
    if (!success) {
      return Response.json({ error: "Too many requests", code: ErrorCodes.RATE_LIMITED }, { status: 429 });
    }

    const parsed = requestSignupOtpSchema.safeParse(body);
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

    const result = await requestSignupOtp({
      ...parsed.data,
      role,
    });

    return Response.json(result, { status: 200 });
  } catch (e) {
    return jsonError(e);
  }
}