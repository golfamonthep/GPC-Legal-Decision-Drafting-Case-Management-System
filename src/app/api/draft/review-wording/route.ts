import { NextResponse } from 'next/server';
import { reviewLegalWording, ReviewMode } from '@/lib/ai/legalWordingReviewer';
import { toAiRouteError } from '@/lib/ai/revisionGuard';
import { auditLog } from '@/lib/audit';
import { requireApiPermission } from "@/lib/auth/requireApiPermission";

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission("USE_AI_REVIEW");
    const body = await req.json();
    const {
      caseId,
      draftId,
      sectionId,
      sectionType,
      currentSectionText,
      reviewMode,
      expectedCaseUpdatedAt,
      expectedDraftUpdatedAt,
      expectedSectionUpdatedAt,
      expectedSectionContent,
    } = body;

    if (!caseId || !sectionType || !currentSectionText || !reviewMode) {
      return NextResponse.json(
        { error: 'Missing required parameters: caseId, sectionType, currentSectionText, or reviewMode.' },
        { status: 400 }
      );
    }

    await auditLog({
      userId: user.id,
      action: "AI_LEGAL_WORDING_REVIEW_REQUESTED",
      entityType: "DecisionDraftSection",
      entityId: sectionId || "unknown",
      afterValue: JSON.stringify({ reviewMode, sectionType })
    });

    // Attempt to review the section wording using AI
    const result = await reviewLegalWording({
      caseId,
      draftId,
      sectionId,
      sectionType,
      currentSectionText,
      reviewMode: reviewMode as ReviewMode,
      userId: user.id,
      expectedCaseUpdatedAt,
      expectedDraftUpdatedAt,
      expectedSectionUpdatedAt,
      expectedSectionContent,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error reviewing wording:', error);
    const mapped = toAiRouteError(error, 'ระบบเกิดข้อผิดพลาดในการตรวจสอบถ้อยคำ กรุณาลองใหม่อีกครั้ง');
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

