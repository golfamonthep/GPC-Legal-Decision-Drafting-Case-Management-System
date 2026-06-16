import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { getAdminMetrics } from "@/lib/admin/adminMetrics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await requireApiPermission("VIEW_ADMIN_CONSOLE");
    const metrics = await getAdminMetrics(user.id);
    return NextResponse.json({ ok: true, data: metrics });
  } catch (error: any) {
    console.error("[API_ADMIN_USAGE_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal Server Error" },
      { status: error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN" ? 401 : 500 }
    );
  }
}
