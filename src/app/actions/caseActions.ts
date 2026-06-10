"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateCase(caseId: string, data: any) {
  // We'll perform everything inside a transaction
  return await prisma.$transaction(async (tx) => {
    const existingCase = await tx.case.findUnique({
      where: { id: caseId },
    });

    if (!existingCase) {
      throw new Error("Case not found");
    }

    // Determine what changed
    const changes: Record<string, { before: any; after: any }> = {};
    const updatedData: any = {};

    const updatableFields = [
      "type",
      "blackNumber",
      "redNumber",
      "petitionerName",
      "respondentName",
      "subject",
      "legalCategory",
      "ownerId",
      "legalOfficerId",
      "legalOfficerName",
      "currentStatus",
      "decisionResult",
      "proceedingNote",
    ];

    for (const field of updatableFields) {
      if (data[field] !== undefined && data[field] !== (existingCase as any)[field]) {
        changes[field] = {
          before: (existingCase as any)[field],
          after: data[field],
        };
        updatedData[field] = data[field];
      }
    }

    // Handle Dates explicitly
    const dateFields = ["receivedDate", "meetingDate"];
    for (const field of dateFields) {
      if (data[field] !== undefined) {
        const existingDateStr = (existingCase as any)[field]?.toISOString();
        const newDateStr = data[field] ? new Date(data[field]).toISOString() : null;
        
        if (existingDateStr !== newDateStr) {
          changes[field] = {
            before: existingDateStr,
            after: newDateStr,
          };
          updatedData[field] = data[field] ? new Date(data[field]) : null;
        }
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return existingCase; // Nothing to update
    }

    // Recompute due dates if receivedDate changed
    if (updatedData.receivedDate) {
      const receivedDate = new Date(updatedData.receivedDate);
      updatedData.dueDate30 = new Date(receivedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      updatedData.dueDate60 = new Date(receivedDate.getTime() + 60 * 24 * 60 * 60 * 1000);
      updatedData.dueDate90 = new Date(receivedDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      updatedData.dueDate120 = new Date(receivedDate.getTime() + 120 * 24 * 60 * 60 * 1000);
      updatedData.dueDate240 = new Date(receivedDate.getTime() + 240 * 24 * 60 * 60 * 1000);
    }

    // Perform Update
    const updatedCase = await tx.case.update({
      where: { id: caseId },
      data: updatedData,
    });

    // Record AuditLog
    await tx.auditLog.create({
      data: {
        action: "CASE_UPDATED",
        entityType: "Case",
        entityId: caseId,
        beforeValue: JSON.stringify(
          Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.before]))
        ),
        afterValue: JSON.stringify(
          Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.after]))
        ),
      },
    });

    // Add CaseEvents for important workflow changes
    const eventsToCreate = [];

    if (changes.currentStatus) {
      eventsToCreate.push({
        caseId,
        action: `เปลี่ยนสถานะเป็น: ${changes.currentStatus.after}`,
        actorName: "System (User Edit)",
      });
    }

    if (changes.redNumber && !changes.redNumber.before && changes.redNumber.after) {
      eventsToCreate.push({
        caseId,
        action: `ระบุเลขเรื่องแดง: ${changes.redNumber.after}`,
        actorName: "System (User Edit)",
      });
    }

    if (changes.legalOfficerId || changes.legalOfficerName) {
      eventsToCreate.push({
        caseId,
        action: `เปลี่ยนนิติกรผู้รับผิดชอบ`,
        actorName: "System (User Edit)",
      });
    }

    if (changes.proceedingNote) {
      eventsToCreate.push({
        caseId,
        action: `อัปเดตการดำเนินการ (บันทึกข้อความ)`,
        actorName: "System (User Edit)",
      });
    }

    if (changes.decisionResult) {
      eventsToCreate.push({
        caseId,
        action: `อัปเดตผลคำวินิจฉัย: ${changes.decisionResult.after}`,
        actorName: "System (User Edit)",
      });
    }

    if (changes.meetingDate) {
      eventsToCreate.push({
        caseId,
        action: `กำหนด/เลื่อนวันนัดพิจารณา`,
        actorName: "System (User Edit)",
      });
    }

    if (eventsToCreate.length > 0) {
      await tx.caseEvent.createMany({
        data: eventsToCreate,
      });
    }

    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);

    return updatedCase;
  });
}
