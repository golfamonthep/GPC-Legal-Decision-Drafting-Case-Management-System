import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import { createMeeting } from "@/lib/meetings/meetingWorkflow";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, 'VIEW_MEETINGS')) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดูวาระประชุม" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      orderBy: { meetingDate: 'desc' },
      include: {
        _count: {
          select: { agendaItems: true }
        }
      }
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการประชุม" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, 'MANAGE_MEETINGS')) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์จัดการวาระประชุม" }, { status: 403 });
    }

    const body = await req.json();
    const { title, meetingNo, meetingDate, startTime, endTime, location, meetingType, chairName, secretaryName, notes } = body;

    if (!title || !meetingNo || !meetingDate) {
      return NextResponse.json({ error: "กรุณาระบุข้อมูลที่จำเป็น (ชื่อการประชุม, ครั้งที่, วันที่)" }, { status: 400 });
    }

    const meeting = await createMeeting({
      title,
      meetingNo,
      meetingDate: new Date(meetingDate),
      startTime,
      endTime,
      location,
      meetingType,
      chairName,
      secretaryName,
      notes,
      createdByUserId: user.id
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json({ error: "ไม่สามารถสร้างการประชุมได้" }, { status: 500 });
  }
}
