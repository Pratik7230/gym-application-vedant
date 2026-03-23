import { tryRefreshFromRequest } from "@/lib/auth/session.js";
import { setAuthCookies } from "@/lib/auth/cookies.js";
import { jsonError } from "@/lib/errors.js";

export async function POST(request) {
  try {
    const result = await tryRefreshFromRequest(request);
    if (!result) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
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
