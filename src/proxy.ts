import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  // EMERGENCY HARD BYPASS FOR MVP
  // Force redirect /login to /dashboard
  if (req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  // Allow all requests to pass through without authentication
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/health|_next/static|_next/image|favicon.ico).*)"
  ],
};
