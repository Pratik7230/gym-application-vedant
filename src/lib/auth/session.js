import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "./jwt.js";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { ROLES } from "@/constants/roles";
import { AppError, ErrorCodes } from "@/lib/errors.js";

export async function getAccessTokenFromCookies() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshTokenFromCookies() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

/** Request-based (Route Handlers) */
export function getCookieHeader(request) {
  return request.headers.get("cookie") ?? "";
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}

export async function getAuthFromRequest(request) {
  const parsed = parseCookies(getCookieHeader(request));
  const access = parsed[ACCESS_COOKIE];
  if (!access) return null;
  try {
    const payload = await verifyAccessToken(access);
    const sub = payload.sub;
    const role = payload.role;
    if (!sub || !role) return null;
    return { userId: String(sub), role: String(role), rv: Number(payload.rv ?? 0) };
  } catch {
    return null;
  }
}

export async function requireAuth(request, allowedRoles) {
  const auth = await getAuthFromRequest(request);
  if (!auth) throw new AppError("Unauthorized", 401, ErrorCodes.UNAUTHORIZED);
  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    throw new AppError("Forbidden", 403, ErrorCodes.FORBIDDEN);
  }
  await connectDB();
  const user = await User.findById(auth.userId).lean();
  if (!user || !user.isActive) throw new AppError("Unauthorized", 401, ErrorCodes.UNAUTHORIZED);
  if (user.refreshTokenVersion !== auth.rv) throw new AppError("Unauthorized", 401, ErrorCodes.UNAUTHORIZED);
  return { ...auth, user };
}

export async function tryRefreshFromRequest(request) {
  const parsed = parseCookies(getCookieHeader(request));
  const refresh = parsed[REFRESH_COOKIE];
  if (!refresh) return null;
  try {
    const payload = await verifyRefreshToken(refresh);
    const sub = payload.sub;
    const rv = Number(payload.rv ?? 0);
    if (!sub) return null;
    await connectDB();
    const user = await User.findById(sub);
    if (!user || !user.isActive || user.refreshTokenVersion !== rv) return null;
    user.refreshTokenVersion += 1;
    await user.save();
    const access = await signAccessToken({
      sub: user._id.toString(),
      role: user.role,
      rv: user.refreshTokenVersion,
    });
    const newRefresh = await signRefreshToken({
      sub: user._id.toString(),
      rv: user.refreshTokenVersion,
    });
    return { user, access, refresh: newRefresh };
  } catch {
    return null;
  }
}

export { ROLES };
