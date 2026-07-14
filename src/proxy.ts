import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const nextAuthMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default function middleware(req: NextRequest, event: any) {
  const authMode = process.env.AUTH_MODE || "microsoft";

  if (authMode === "disabled" && process.env.NODE_ENV === "production") {
    return new NextResponse("Disabled auth mode is not allowed in production.", { status: 403 });
  }

  if (authMode === "disabled") {
    return NextResponse.next();
  }

  if (authMode === "simple") {
    const isPublicPath = req.nextUrl.pathname.startsWith("/login") || 
                         req.nextUrl.pathname.startsWith("/api/auth") ||
                         req.nextUrl.pathname.startsWith("/api/health") ||
                         req.nextUrl.pathname.startsWith("/_next") ||
                         req.nextUrl.pathname === "/favicon.ico";

    if (isPublicPath) {
      if (req.nextUrl.pathname === "/login") {
        const mvpSession = req.cookies.get("mvp_session")?.value;
        if (mvpSession === "true") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
      return NextResponse.next();
    }

    const mvpSession = req.cookies.get("mvp_session")?.value;
    if (mvpSession !== "true") {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }

  return (nextAuthMiddleware as any)(req, event);
}

export const config = {
  matcher: [
    "/((?!login|api/auth|api/health|_next/static|_next/image|favicon.ico).*)"
  ],
};
