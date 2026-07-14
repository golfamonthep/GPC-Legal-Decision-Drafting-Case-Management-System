import { NextResponse } from "next/server";
import { getAuthMode } from "@/lib/auth/mvp-auth";

export async function GET() {
  return NextResponse.json({ mode: getAuthMode() });
}
