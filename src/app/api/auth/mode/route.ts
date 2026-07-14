import { NextResponse } from "next/server";
import { getAuthMode } from "@/lib/auth/mvp-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ mode: getAuthMode() });
}
