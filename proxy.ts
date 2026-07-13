import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || "fallback-secret-for-local-dev-only-change-this-in-prod"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ["/dashboard", "/onboarding", "/plan", "/checkin"];
  const isPathProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Get session token
  const token = request.cookies.get("session")?.value;

  let sessionValid = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey, {
        algorithms: ["HS256"],
      });
      sessionValid = true;
    } catch (e) {
      // Invalid token
    }
  }

  // Redirect to auth if trying to access protected route without valid session
  if (isPathProtected && !sessionValid) {
    const url = new URL("/auth", request.url);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged in and trying to access auth
  if (pathname.startsWith("/auth") && sessionValid) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/plan/:path*",
    "/checkin/:path*",
    "/auth/:path*",
  ],
};
