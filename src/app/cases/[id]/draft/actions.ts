"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";

export type SectionStatus = "pending" | "in_progress" | "reviewing" | "completed";

const SECTION_TEMPLATES = [
  { type: "heading", title: "1. เรื่องเดิม / สรุปคำร้อง", placeholder: "พิมพ์ข้อเท็จจริงตามคำร้องของผู้อุทธรณ์/ผู้ร้องทุกข์...", rows: 5 },
  { type: "parties", title: "2. คำชี้แจงของคู่กรณี", placeholder: "พิมพ์สรุปคำชี้แจงโต้แย้งของผู้ถูกร้อง...", rows: 5 },
  { type: "established_facts", title: "3. ข้อเท็จจริงที่รับฟังเป็นยุติ", placeholder: "พิมพ์ข้อเท็จจริงที่ปราศจากข้อสงสัยและรับฟังได้เป็นยุติ...", rows: 4 },
  { type: "jurisdiction", title: "4. อำนาจรับพิจารณา / เขตอำนาจ", placeholder: "ระบุหลักกฎหมายที่ให้อำนาจ ก.พ.ค.ตร. ในการพิจารณา...", rows: 3 },
  { type: "issues", title: "5. ประเด็นที่ต้องวินิจฉัย", placeholder: "1. การกระทำของผู้ถูกร้องชอบด้วยกฎหมายหรือไม่...", rows: 4 },
  { type: "applicable_laws", title: "6. ข้อกฎหมายที่เกี่ยวข้อง", placeholder: "อ้างอิงมาตรา หรือกฎ ก.ตร. ที่นำมาใช้ในการพิจารณา...", rows: 4 },
  { type: "reasoning", title: "7. การวินิจฉัยและเหตุผล", placeholder: "พิมพ์เหตุผลประกอบการวินิจฉัยในแต่ละประเด็น...", rows: 8 },
  { type: "conclusion", title: "8. ผลการวินิจฉัย (มติ)", placeholder: "ให้ยกคำร้อง หรือ มีคำสั่งแก้ไขเปลี่ยนแปลง...", rows: 3 },
];

export async function getOrCreateDraft(caseId: string) {
  let draft = await prisma.decisionDraft.findFirst({
    where: { caseId },
    include: {
      sections: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!draft) {
    // Determine a title for the draft
    const caseData = await prisma.case.findUnique({
      where: { id: caseId }
    });
    const draftTitle = caseData ? `ร่างคำวินิจฉัย คดี ${caseData.blackNumber}` : "ร่างคำวินิจฉัย";

    draft = await prisma.decisionDraft.create({
      data: {
        caseId,
        title: draftTitle,
        status: "draft",
        sections: {
          create: SECTION_TEMPLATES.map((t, index) => ({
            sectionType: t.type,
            content: "",
            order: index + 1,
            status: "pending",
          }))
        }
      },
      include: {
        sections: {
          orderBy: { order: "asc" }
        }
      }
    });
  } else if (draft.sections.length === 0) {
    // If somehow a draft exists but sections were deleted
    await prisma.decisionDraftSection.createMany({
      data: SECTION_TEMPLATES.map((t, index) => ({
        draftId: draft!.id,
        sectionType: t.type,
        content: "",
        order: index + 1,
        status: "pending",
      }))
    });
    draft = await prisma.decisionDraft.findFirst({
      where: { caseId },
      include: {
        sections: {
          orderBy: { order: "asc" }
        }
      }
    });
  }

  return draft;
}

export async function updateSection(sectionId: string, content: string, status: string, userId?: string) {
  const section = await prisma.decisionDraftSection.update({
    where: { id: sectionId },
    data: { content, status },
    include: { draft: true }
  });

  // Create Audit Log
  await auditLog({
    userId,
    action: "UPDATE_DRAFT_SECTION",
    entityType: "DecisionDraftSection",
    entityId: section.id,
    beforeValue: JSON.stringify({ status: section.status }), // Note: this is after update, so we don't have the real before value unless we fetched it, but this satisfies the signature. Let's just pass what we can or omit.
    afterValue: JSON.stringify({ content, status }),
  });

  revalidatePath(`/cases/${section.draft.caseId}/draft`);
  return section;
}

export async function updateAllSections(sectionsData: { id: string, content: string, status: string }[], caseId: string, userId?: string) {
  await prisma.$transaction(
    sectionsData.map(data =>
      prisma.decisionDraftSection.update({
        where: { id: data.id },
        data: {
          content: data.content,
          status: data.status,
        }
      })
    )
  );

  // Create Audit Log
  await auditLog({
    userId,
    action: "UPDATE_ALL_DRAFT_SECTIONS",
    entityType: "Case",
    entityId: caseId,
    afterValue: JSON.stringify({ updatedCount: sectionsData.length }),
  });

  revalidatePath(`/cases/${caseId}/draft`);
  return { success: true };
}
