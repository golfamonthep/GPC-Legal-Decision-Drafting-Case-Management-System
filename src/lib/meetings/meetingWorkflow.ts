import prisma from "@/lib/db";
import { checkCaseReadiness } from "./readiness";
import type { CaseEvent } from "@/generated/prisma";

export async function createMeeting(data: {
  title: string;
  meetingNo: string;
  meetingDate: Date;
  startTime?: string;
  endTime?: string;
  location?: string;
  meetingType?: string;
  chairName?: string;
  secretaryName?: string;
  notes?: string;
  createdByUserId: string;
}) {
  const meeting = await prisma.meeting.create({
    data: {
      ...data,
      status: "DRAFT"
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "MEETING_CREATED",
      entityType: "Meeting",
      entityId: meeting.id,
      userId: data.createdByUserId,
      afterValue: JSON.stringify(meeting)
    }
  });

  return meeting;
}

export async function addCaseToMeeting(meetingId: string, caseId: string, userId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { agendaItems: true }
  });

  if (!meeting) throw new Error("ไม่พบการประชุม");

  const existingItem = meeting.agendaItems.find(item => item.caseId === caseId);
  if (existingItem) throw new Error("สำนวนนี้อยู่ในวาระประชุมนี้แล้ว");

  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      drafts: {
        include: { sections: true }
      }
    }
  });

  if (!caseData) throw new Error("ไม่พบสำนวน");

  const readiness = checkCaseReadiness(caseData as any);
  const agendaNo = meeting.agendaItems.length + 1;

  const agendaItem = await prisma.meetingAgendaItem.create({
    data: {
      meetingId,
      caseId,
      agendaNo,
      readinessStatus: readiness.status,
    }
  });

  await prisma.caseEvent.create({
    data: {
      caseId,
      action: `เพิ่มเข้าวาระการประชุม ${meeting.meetingNo}`,
      actorName: userId, // ideally user name, but userId as fallback
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "MEETING_CASE_ADDED",
      entityType: "MeetingAgendaItem",
      entityId: agendaItem.id,
      userId,
      afterValue: JSON.stringify(agendaItem)
    }
  });

  return agendaItem;
}

export async function recordBoardResult(
  agendaItemId: string,
  userId: string,
  data: {
    boardResult: string;
    boardNote?: string;
    postMeetingAction?: string;
    updateCaseStatus?: string;
    redCaseNumber?: string;
  }
) {
  const item = await prisma.meetingAgendaItem.findUnique({
    where: { id: agendaItemId },
    include: { meeting: true, case: true }
  });

  if (!item) throw new Error("ไม่พบวาระการประชุม");

  const updatedItem = await prisma.meetingAgendaItem.update({
    where: { id: agendaItemId },
    data: {
      boardResult: data.boardResult,
      boardNote: data.boardNote,
      postMeetingAction: data.postMeetingAction,
    }
  });

  await prisma.caseEvent.create({
    data: {
      caseId: item.caseId,
      action: `บันทึกผลการพิจารณา: ${data.boardResult}`,
      actorName: userId,
    }
  });

  // Optional updates
  if (data.updateCaseStatus || data.redCaseNumber) {
    const updateData: any = {};
    if (data.updateCaseStatus) {
      updateData.currentStatus = data.updateCaseStatus;
    }
    if (data.redCaseNumber) {
      updateData.redNumber = data.redCaseNumber;
    }

    await prisma.case.update({
      where: { id: item.caseId },
      data: updateData
    });

    await prisma.caseEvent.create({
      data: {
        caseId: item.caseId,
        action: `อัปเดตสถานะ/เลขแดงตามมติที่ประชุม`,
        actorName: userId,
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "MEETING_RESULT_RECORDED",
      entityType: "MeetingAgendaItem",
      entityId: agendaItemId,
      userId,
      afterValue: JSON.stringify(updatedItem)
    }
  });

  return updatedItem;
}
