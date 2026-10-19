"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/requirePermission";
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { StaleRevisionError } from "@/lib/ai/revisionGuard";

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

function isSameTimestamp(expected: string | Date, actual: Date): boolean {
  const parsed = expected instanceof Date ? expected : new Date(String(expected));
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() === actual.getTime();
}

export async function getOrCreateDraft(caseId: string) {
  await requirePermission("VIEW_DRAFT");

  let draft = await prisma.decisionDraft.findFirst({
    where: { caseId },
    include: {
      sections: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!draft) {
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

export async function updateSection(
  sectionId: string,
  content: string,
  status: string,
  expectedUpdatedAt?: string | Date,
) {
  const user = await requireApiPermission("EDIT_DRAFT");

  const currentSection = await prisma.decisionDraftSection.findUnique({
    where: { id: sectionId },
    include: { draft: true },
  });

  if (!currentSection) {
    throw new Error("ไม่พบส่วนร่างคำวินิจฉัย");
  }

  if (expectedUpdatedAt && !isSameTimestamp(expectedUpdatedAt, currentSection.updatedAt)) {
    throw new StaleRevisionError("ร่างส่วนนี้ถูกแก้ไขจากหน้าต่างอื่น กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก");
  }

  const updated = await prisma.decisionDraftSection.updateMany({
    where: { id: sectionId, updatedAt: currentSection.updatedAt },
    data: { content, status, updatedAt: new Date() },
  });

  if (updated.count !== 1) {
    throw new StaleRevisionError("ร่างส่วนนี้ถูกแก้ไขพร้อมกัน กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก");
  }

  const section = await prisma.decisionDraftSection.findUniqueOrThrow({
    where: { id: sectionId },
    include: { draft: true },
  });

  await auditLog({
    userId: user.id,
    action: "UPDATE_DRAFT_SECTION",
    entityType: "DecisionDraftSection",
    entityId: section.id,
    beforeValue: JSON.stringify({ content: currentSection.content, status: currentSection.status }),
    afterValue: JSON.stringify({ content, status }),
  });

  revalidatePath(`/cases/${section.draft.caseId}/draft`);
  return section;
}

export async function updateAllSections(
  sectionsData: { id: string; content: string; status: string; expectedUpdatedAt?: string | Date }[],
  caseId: string,
) {
  const user = await requireApiPermission("EDIT_DRAFT");

  const ids = sectionsData.map((s) => s.id);
  const existingSections = await prisma.decisionDraftSection.findMany({
    where: { id: { in: ids }, draft: { caseId } },
  });

  if (existingSections.length !== sectionsData.length) {
    throw new Error("ข้อมูลส่วนร่างคำวินิจฉัยไม่ตรงกับสำนวนนี้");
  }

  const byId = new Map(existingSections.map((s) => [s.id, s]));
  for (const item of sectionsData) {
    const current = byId.get(item.id);
    if (!current) {
      throw new Error("ไม่พบส่วนร่างคำวินิจฉัย");
    }
    if (item.expectedUpdatedAt && !isSameTimestamp(item.expectedUpdatedAt, current.updatedAt)) {
      throw new StaleRevisionError("ร่างบางส่วนถูกแก้ไขจากหน้าต่างอื่น กรุณาโหลดข้อมูลล่าสุดก่อนบันทึกทั้งหมด");
    }
  }

  const updatedSections = await prisma.$transaction(
    sectionsData.map((data) =>
      prisma.decisionDraftSection.update({
        where: { id: data.id },
        data: {
          content: data.content,
          status: data.status,
        },
      }),
    ),
  );

  await auditLog({
    userId: user.id,
    action: "UPDATE_ALL_DRAFT_SECTIONS",
    entityType: "Case",
    entityId: caseId,
    afterValue: JSON.stringify({ updatedCount: sectionsData.length }),
  });

  revalidatePath(`/cases/${caseId}/draft`);
  return { success: true, sections: updatedSections };
}

export async function applyReviewSuggestion(
  sectionId: string,
  newContent: string,
  caseId: string,
  expectedUpdatedAt?: string | Date,
  expectedContent?: string,
) {
  const user = await requireApiPermission("EDIT_DRAFT");

  const currentSection = await prisma.decisionDraftSection.findUnique({
    where: { id: sectionId },
    include: { draft: true },
  });

  if (!currentSection || currentSection.draft.caseId !== caseId) {
    throw new Error("ไม่พบส่วนร่างคำวินิจฉัยในสำนวนนี้");
  }

  if (expectedUpdatedAt && !isSameTimestamp(expectedUpdatedAt, currentSection.updatedAt)) {
    throw new StaleRevisionError(
      "ร่างส่วนนี้ถูกแก้ไขหลังจาก AI ตรวจถ้อยคำ ระบบยกเลิกการนำไปใช้เพื่อไม่ให้ทับร่างมนุษย์",
    );
  }

  if (expectedContent !== undefined && currentSection.content !== expectedContent) {
    throw new StaleRevisionError(
      "เนื้อหาร่างในระบบเปลี่ยนไปหลังจาก AI ตรวจถ้อยคำ ระบบยกเลิกการนำไปใช้เพื่อไม่ให้ทับร่างมนุษย์",
    );
  }

  const updated = await prisma.decisionDraftSection.updateMany({
    where: { id: sectionId, updatedAt: currentSection.updatedAt },
    data: { content: newContent, updatedAt: new Date() },
  });

  if (updated.count !== 1) {
    throw new StaleRevisionError(
      "ร่างส่วนนี้ถูกแก้ไขพร้อมกัน ระบบยกเลิกการนำไปใช้เพื่อไม่ให้ทับร่างมนุษย์",
    );
  }

  const updatedSection = await prisma.decisionDraftSection.findUniqueOrThrow({
    where: { id: sectionId },
  });

  await auditLog({
    userId: user.id,
    action: "AI_LEGAL_WORDING_SUGGESTION_APPLIED",
    entityType: "DecisionDraftSection",
    entityId: sectionId,
    beforeValue: currentSection.content,
    afterValue: newContent,
  });

  revalidatePath(`/cases/${caseId}/draft`);
  return updatedSection;
}

