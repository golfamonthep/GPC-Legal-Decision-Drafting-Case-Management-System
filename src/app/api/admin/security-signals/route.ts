import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireApiPermission("VIEW_ADMIN_CONSOLE");
    
    // Look for suspicious activity based on typical action strings
    const suspiciousActions = ['LOGIN_FAILED', 'PERMISSION_DENIED', 'UNAUTHORIZED_ACCESS'];
    
    const signals = await prisma.auditLog.findMany({
      where: {
        action: {
          in: suspiciousActions
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({ ok: true, data: signals });
  } catch (error: any) {
    console.error("[API_ADMIN_SECURITY_SIGNALS_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal Server Error" },
      { status: error?.message === "UNAUTHORIZED" || error?.message === "FORBIDDEN" ? 401 : 500 }
    );
  }
}
