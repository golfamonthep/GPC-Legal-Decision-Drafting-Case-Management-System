import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";

export async function GET() {
  try {
    await requireApiPermission("MANAGE_USERS");
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
      }
    });

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === "FORBIDDEN") return NextResponse.json({ error: "คุณไม่มีสิทธิ์" }, { status: 403 });
    if (error.message === "UNAUTHORIZED") return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
