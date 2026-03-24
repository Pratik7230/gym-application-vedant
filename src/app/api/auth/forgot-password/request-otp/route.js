import { forgotPasswordRequestSchema } from "@/validators/auth.js";
import { requestPasswordResetOtp } from "@/services/authService.js";
import { jsonError, ErrorCodes } from "@/lib/errors.js";
import { getAuthRateLimit, getClientIp } from "@/lib/rate-limit.js";

export async function POST(request) {
  try {
    const rl = getAuthRateLimit();
    const ip = getClientIp(request);
    const body = await request.json();
    const email = body?.email ?? "";
    const { success } = await rl.limit(`forgot-otp:${ip}:${email}`);
    if (!success) {
      return Response.json({ error: "Too many requests", code: ErrorCodes.RATE_LIMITED }, { status: 429 });
    }

    const parsed = forgotPasswordRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await requestPasswordResetOtp(parsed.data);
    return Response.json({ ok: true, message: "If the account exists, an OTP has been sent" });
  } catch (e) {
    return jsonError(e);
  }
}