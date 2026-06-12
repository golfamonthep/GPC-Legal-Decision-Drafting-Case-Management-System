import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { hasPermission } from "@/lib/auth/permissions";
import { addCaseToMeeting } from "@/lib/meetings/meetingWorkflow";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, 'ADD_CASE_TO_MEETING')) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์จัดการวาระประชุม" }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await req.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json({ error: "ไม่พบสำนวน" }, { status: 400 });
    }

    const agendaItem = await addCaseToMeeting(resolvedParams.id, caseId, user.id);

    return NextResponse.json(agendaItem, { status: 201 });
  } catch (error: any) {
    console.error("Error adding case to meeting:", error);
    return NextResponse.json({ error: error.message || "ไม่สามารถเพิ่มสำนวนเข้าวาระได้" }, { status: 500 });
  }
}
