import { cookies } from "next/headers";
import { ACCESS_COOKIE, verifyAccessToken } from "./jwt.js";
import { connectDB } from "@/lib/db.js";
import User from "@/models/User.js";

export async function getServerAuthUser() {
  try {
    const store = await cookies();
    const access = store.get(ACCESS_COOKIE)?.value;
    if (!access) return null;
    const payload = await verifyAccessToken(access);
    const sub = payload.sub;
    const rv = Number(payload.rv ?? 0);
    if (!sub) return null;
    await connectDB();
    const user = await User.findById(sub).select("-passwordHash").lean();
    if (!user || !user.isActive || user.refreshTokenVersion !== rv) return null;
    return user;
  } catch {
    return null;
  }
}
