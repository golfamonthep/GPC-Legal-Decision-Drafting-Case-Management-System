import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getAuthMode } from "@/lib/auth/auth-mode";
import {
  MVP_SESSION_COOKIE,
  verifySignedMvpSessionToken,
} from "@/lib/auth/mvp-session";

const nextAuthMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

function unauthorizedApiResponse() {
  return NextResponse.json(
    { success: false, code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" },
    { status: 401 },
  );
}

export default async function middleware(req: NextRequest, event: unknown) {
  const authMode = getAuthMode();
  const pathname = req.nextUrl.pathname;
  const isLoginPath = pathname.startsWith("/login");

  if (authMode === "misconfigured") {
    if (isLoginPath) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          code: "AUTH_CONFIGURATION_ERROR",
          message: "Authentication is not configured safely.",
        },
        { status: 503 },
      );
    }

    return new NextResponse("Authentication is not configured safely.", { status: 503 });
  }

  if (authMode === "none") {
    if (isLoginPath) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (authMode === "simple") {
    const token = req.cookies.get(MVP_SESSION_COOKIE)?.value;
    const hasValidSession = await verifySignedMvpSessionToken(token);

    if (isLoginPath) {
      return hasValidSession
        ? NextResponse.redirect(new URL("/dashboard", req.url))
        : NextResponse.next();
    }

    if (!hasValidSession) {
      if (pathname.startsWith("/api/")) return unauthorizedApiResponse();

      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (isLoginPath) return NextResponse.next();
  return (nextAuthMiddleware as any)(req, event);
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
