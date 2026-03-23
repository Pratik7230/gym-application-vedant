import { loginSchema } from "@/validators/auth.js";
import { loginUser } from "@/services/authService.js";
import { setAuthCookies } from "@/lib/auth/cookies.js";
import { jsonError } from "@/lib/errors.js";
import { getAuthRateLimit, getClientIp } from "@/lib/rate-limit.js";

export async function POST(request) {
  try {
    const rl = getAuthRateLimit();
    const ip = getClientIp(request);
    const body = await request.json();
    const email = body?.email ?? "";
    const { success } = await rl.limit(`login:${ip}:${email}`);
    if (!success) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { user, access, refresh } = await loginUser(parsed.data);
    await setAuthCookies(access, refresh);

    return Response.json({ user });
  } catch (e) {
    return jsonError(e);
  }
}
