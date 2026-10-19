import { NextResponse } from 'next/server';
import { reviewLegalWording, ReviewMode } from '@/lib/ai/legalWordingReviewer';
import { auditLog } from '@/lib/audit';
import { requireApiPermission } from "@/lib/auth/requireApiPermission";

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission("USE_AI_REVIEW");
    const body = await req.json();
    const { caseId, draftId, sectionId, sectionType, currentSectionText, reviewMode } = body;

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
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error reviewing wording:', error);

    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    // Provide a descriptive error message gracefully
    if (error.message.includes('Section text is empty')) {
      return NextResponse.json(
        { error: "ข้อความว่างเปล่า ไม่สามารถตรวจสอบได้" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'ระบบเกิดข้อผิดพลาดในการตรวจสอบถ้อยคำ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
