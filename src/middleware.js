import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ROLES } from "./constants/roles.js";

const ACCESS_SECRET = () =>
  new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "");

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/cron")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const loginUrl = new URL("/login", request.url);

  if (!process.env.JWT_ACCESS_SECRET) {
    if (process.env.NODE_ENV === "production") {
      loginUrl.searchParams.set("error", "server_config");
      return NextResponse.redirect(loginUrl);
    }
    console.warn("[middleware] JWT_ACCESS_SECRET is not set; protected routes are not secured in development.");
    return NextResponse.next();
  }

  if (!token) {
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET());
    const role = String(payload.role || "");

    if (pathname.startsWith("/admin") && role !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
    }
    if (pathname.startsWith("/trainer") && role !== ROLES.TRAINER) {
      return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
    }
    if (pathname.startsWith("/client") && role !== ROLES.CLIENT) {
      return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
    }

    return NextResponse.next();
  } catch {
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

function dashboardForRole(role) {
  if (role === ROLES.ADMIN) return "/admin";
  if (role === ROLES.TRAINER) return "/trainer";
  if (role === ROLES.CLIENT) return "/client";
  return "/login";
}

export const config = {
  matcher: ["/admin/:path*", "/trainer/:path*", "/client/:path*"],
};
