import { tryRefreshFromRequest } from "@/lib/auth/session.js";
import { setAuthCookies } from "@/lib/auth/cookies.js";
import { jsonError, ErrorCodes } from "@/lib/errors.js";
import { getTokenRefreshRateLimit, getClientIp } from "@/lib/rate-limit.js";

export async function POST(request) {
  try {
    const rl = getTokenRefreshRateLimit();
    const ip = getClientIp(request);
    const { success } = await rl.limit(`refresh:${ip}`);
    if (!success) {
      return Response.json({ error: "Too many requests", code: ErrorCodes.RATE_LIMITED }, { status: 429 });
    }

    const result = await tryRefreshFromRequest(request);
    if (!result) {
      return Response.json({ error: "Unauthorized", code: ErrorCodes.UNAUTHORIZED }, { status: 401 });
    }
    await setAuthCookies(result.access, result.refresh);
    return Response.json({
      user: {
        id: result.user._id.toString(),
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
