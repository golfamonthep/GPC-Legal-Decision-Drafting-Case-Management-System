import { NextResponse } from "next/server";
import { clearMvpSession } from "@/lib/auth/mvp-auth";

export async function POST() {
  await clearMvpSession();
  return NextResponse.json({ success: true });
}
