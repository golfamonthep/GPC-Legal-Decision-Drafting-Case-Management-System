import { NextResponse } from 'next/server';
import { checkCitationCoverage, CoverageMode } from '@/lib/ai/citationCoverageChecker';
import { requireApiPermission } from "@/lib/auth/requireApiPermission";
import { auditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission("USE_AI_REVIEW");
    const body = await req.json();
    const { caseId, draftId, sectionId, sectionType, currentSectionText, coverageMode } = body;

    if (!caseId || !sectionType || !currentSectionText || !coverageMode) {
      return NextResponse.json(
        { error: 'Missing required parameters: caseId, sectionType, currentSectionText, or coverageMode.' },
        { status: 400 }
      );
    }

    await auditLog({
        userId: user.id,
        action: "AI_CITATION_COVERAGE_CHECK_REQUESTED",
        entityType: "DecisionDraftSection",
        entityId: sectionId || "unknown",
        afterValue: JSON.stringify({ coverageMode, sectionType })
      });

    const result = await checkCitationCoverage({
      caseId,
      draftId,
      sectionId,
      sectionType,
      currentSectionText,
      coverageMode: coverageMode as CoverageMode,
      userId: user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error checking citation coverage:', error);

    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
    }
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    if (error.message.includes('Section text is empty')) {
      return NextResponse.json(
        { error: "ข้อความว่างเปล่า ไม่สามารถตรวจสอบแหล่งอ้างอิงได้" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'ระบบเกิดข้อผิดพลาดในการตรวจสอบแหล่งอ้างอิง กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
