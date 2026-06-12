import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, 'VIEW_MEETINGS')) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดูวาระประชุม" }, { status: 403 });
    }
    const resolvedParams = await params;
    const meeting = await prisma.meeting.findUnique({
      where: { id: resolvedParams.id },
      include: {
        agendaItems: {
          include: {
            case: {
              select: {
                id: true,
                blackNumber: true,
                redNumber: true,
                type: true,
                subject: true,
                petitionerName: true,
                currentStatus: true,
                legalOfficerName: true,
                committeeOwnerName: true,
              }
            }
          },
          orderBy: { agendaNo: 'asc' }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: "ไม่พบการประชุม" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, 'MANAGE_MEETINGS')) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์จัดการวาระประชุม" }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const updateData: any = {};
    const allowedFields = ["title", "meetingNo", "meetingDate", "startTime", "endTime", "location", "meetingType", "status", "chairName", "secretaryName", "notes"];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'meetingDate') {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const meeting = await prisma.meeting.update({
      where: { id: resolvedParams.id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        action: "MEETING_UPDATED",
        entityType: "Meeting",
        entityId: resolvedParams.id,
        userId: user.id,
        afterValue: JSON.stringify(updateData)
      }
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json({ error: "ไม่สามารถอัปเดตการประชุมได้" }, { status: 500 });
  }
}
