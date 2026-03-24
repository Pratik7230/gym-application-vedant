import { clearAuthCookies } from "@/lib/auth/cookies.js";
import { getAuthFromRequest } from "@/lib/auth/session.js";
import { logoutUser } from "@/services/authService.js";
import { connectDB } from "@/lib/db.js";

export async function POST(request) {
  try {
    const auth = await getAuthFromRequest(request);
    if (auth) {
      await connectDB();
      await logoutUser(auth.userId);
    }
    await clearAuthCookies();
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[logout]", e);
    await clearAuthCookies();
    return Response.json({ ok: true });
  }
}
