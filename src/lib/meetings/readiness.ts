import { Case, DecisionDraft, DecisionDraftSection } from "@prisma/client";

export type ReadinessCheckResult = {
  status: "READY" | "NEEDS_REVISION" | "PENDING_REVIEW";
  missingRequirements: string[];
};

type CaseWithDrafts = Case & {
  drafts?: (DecisionDraft & {
    sections: DecisionDraftSection[];
  })[];
};

export function checkCaseReadiness(caseData: CaseWithDrafts): ReadinessCheckResult {
  const missingRequirements: string[] = [];

  if (!caseData.blackNumber) {
    missingRequirements.push("ไม่พบเลขดำ");
  }
  if (!caseData.petitionerName) {
    missingRequirements.push("ไม่พบชื่อผู้ร้องทุกข์/ผู้อุทธรณ์");
  }
  if (!caseData.subject) {
    missingRequirements.push("ไม่พบเรื่อง");
  }
  if (!caseData.legalOfficerId) {
    missingRequirements.push("ยังไม่ได้มอบหมายนิติกร");
  }

  const drafts = caseData.drafts;
  if (!drafts || drafts.length === 0) {
    missingRequirements.push("ยังไม่มีร่างคำวินิจฉัย");
  } else {
    const latestDraft = drafts[drafts.length - 1];
    const sections = latestDraft.sections || [];
    
    const hasFacts = sections.some(s => s.sectionType === "facts" && s.content && s.content.trim().length > 10);
    const hasReasoning = sections.some(s => s.sectionType === "reasoning" && s.content && s.content.trim().length > 10);
    const hasConclusion = sections.some(s => s.sectionType === "conclusion" && s.content && s.content.trim().length > 10);

    if (!hasFacts) {
      missingRequirements.push("ร่างคำวินิจฉัยขาดส่วนข้อเท็จจริง");
    }
    if (!hasReasoning) {
      missingRequirements.push("ร่างคำวินิจฉัยขาดส่วนเหตุผล");
    }
    if (!hasConclusion) {
      missingRequirements.push("ร่างคำวินิจฉัยขาดส่วนข้อพิจารณา/บทสรุป");
    }
  }

  const status = missingRequirements.length === 0 ? "READY" : "NEEDS_REVISION";

  return {
    status,
    missingRequirements,
  };
}
