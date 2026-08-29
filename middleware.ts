import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret =
    process.env.NEXTAUTH_SECRET || "development-secret-key-32chars-minimum-key";

  const isSecure = req.cookies.has("__Secure-next-auth.session-token");
  const token = await getToken({
    req,
    secret,
    cookieName: isSecure
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token",
  });

  const { pathname } = req.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const isProtectedAppRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/workout") ||
    pathname.startsWith("/diet") ||
    pathname.startsWith("/progress");

  // If user is authenticated and visits login/register, redirect to /home
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // If user is unauthenticated and visits protected app route, redirect to /login
  if (!token && isProtectedAppRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/home",
    "/workout/:path*",
    "/workout",
    "/diet/:path*",
    "/diet",
    "/progress/:path*",
    "/progress",
    "/login",
    "/register",
  ],
};

