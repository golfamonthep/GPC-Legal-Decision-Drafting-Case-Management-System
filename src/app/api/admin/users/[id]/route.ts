import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireApiPermission("MANAGE_USERS");
    const { id } = await params;
    const body = await req.json();
    const { role, status } = body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // Prevent demoting or disabling the last ADMIN
    if (targetUser.role === 'ADMIN' && (role !== 'ADMIN' || status === 'DISABLED')) {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "ไม่สามารถลดสิทธิ์หรือระงับผู้ดูแลระบบคนสุดท้ายได้" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Audit logs
    if (role && role !== targetUser.role) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "USER_ROLE_CHANGED",
          entityType: "User",
          entityId: id,
          beforeValue: targetUser.role,
          afterValue: role,
        }
      });
    }

    if (status && status !== targetUser.status) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "USER_STATUS_CHANGED",
          entityType: "User",
          entityId: id,
          beforeValue: targetUser.status,
          afterValue: status,
        }
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return NextResponse.json({ error: "คุณไม่มีสิทธิ์" }, { status: 403 });
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
