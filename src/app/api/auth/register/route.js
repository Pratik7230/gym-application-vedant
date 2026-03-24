import { verifySignupOtpSchema } from "@/validators/auth.js";
import { completeSignupWithOtp } from "@/services/authService.js";
import { setAuthCookies } from "@/lib/auth/cookies.js";
import { jsonError, ErrorCodes } from "@/lib/errors.js";
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
    const parsed = verifySignupOtpSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { user, access, refresh } = await completeSignupWithOtp(parsed.data);

    await setAuthCookies(access, refresh);

    return Response.json({ user }, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
