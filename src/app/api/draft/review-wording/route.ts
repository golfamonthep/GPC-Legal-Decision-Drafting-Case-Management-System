import { NextResponse } from 'next/server';
import { reviewLegalWording, ReviewMode } from '@/lib/ai/legalWordingReviewer';
import { auditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, draftId, sectionId, sectionType, currentSectionText, reviewMode, userId } = body;

    if (!caseId || !sectionType || !currentSectionText || !reviewMode) {
      return NextResponse.json(
        { error: 'Missing required parameters: caseId, sectionType, currentSectionText, or reviewMode.' },
        { status: 400 }
      );
    }

    if (userId) {
      await auditLog({
        userId,
        action: "AI_LEGAL_WORDING_REVIEW_REQUESTED",
        entityType: "DecisionDraftSection",
        entityId: sectionId || "unknown",
        afterValue: JSON.stringify({ reviewMode, sectionType })
      });
    }

    // Attempt to review the section wording using AI
    const result = await reviewLegalWording({
      caseId,
      draftId,
      sectionId,
      sectionType,
      currentSectionText,
      reviewMode: reviewMode as ReviewMode,
      userId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error reviewing wording:', error);

    // Provide a descriptive error message gracefully
    if (error.message.includes('Section text is empty')) {
      return NextResponse.json(
        { error: "ข้อความว่างเปล่า ไม่สามารถตรวจสอบได้" },
        { status: 400 }
      );
    }
    
    // Attempt to get userId from the request somehow to log failure, but req.json might have already failed
    // We already try-catched the error.
    try {
        const body = await req.clone().json();
        if (body.userId) {
          await auditLog({
            userId: body.userId,
            action: "AI_LEGAL_WORDING_REVIEW_FAILED",
            entityType: "DecisionDraftSection",
            entityId: body.sectionId || "unknown",
            afterValue: JSON.stringify({ error: error.message || "Unknown error" })
          });
        }
    } catch(e) {
      // Ignore
    }

    return NextResponse.json(
      { error: 'ระบบเกิดข้อผิดพลาดในการตรวจสอบถ้อยคำ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
