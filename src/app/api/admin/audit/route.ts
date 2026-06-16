import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireApiPermission("VIEW_ADMIN_CONSOLE");
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    return NextResponse.json({ ok: true, data: logs });
  } catch (error: any) {
    console.error("[API_ADMIN_AUDIT_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal Server Error" },
      { status: error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN" ? 401 : 500 }
    );
  }
}
