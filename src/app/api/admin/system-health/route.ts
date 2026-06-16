import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { getSystemHealth } from "@/lib/admin/systemHealth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await requireApiPermission("VIEW_ADMIN_CONSOLE");
    const health = await getSystemHealth(user.id);
    return NextResponse.json({ ok: true, data: health });
  } catch (error: any) {
    console.error("[API_ADMIN_SYSTEM_HEALTH_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal Server Error" },
      { status: error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN" ? 401 : 500 }
    );
  }
}
