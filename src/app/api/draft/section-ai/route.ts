import { NextResponse } from 'next/server';
import { generateDraftSection } from '@/lib/ai/draftSection';
import { toAiRouteError } from '@/lib/ai/revisionGuard';
import { requireApiPermission } from "@/lib/auth/requireApiPermission";

export async function POST(req: Request) {
  try {
    const user = await requireApiPermission("USE_AI_DRAFT");
    const body = await req.json();
    const {
      caseId,
      draftId,
      sectionId,
      sectionType,
      userInstruction,
      legalCategory,
      expectedCaseUpdatedAt,
      expectedDraftUpdatedAt,
      expectedSectionUpdatedAt,
      expectedSectionContent,
    } = body;

    if (!caseId || !draftId || !sectionId || !sectionType || !userInstruction) {
      return NextResponse.json(
        { error: 'Missing required parameters: caseId, draftId, sectionId, sectionType, or userInstruction.' },
        { status: 400 }
      );
    }

    const result = await generateDraftSection({
      caseId,
      draftId,
      sectionId,
      sectionType,
      userInstruction,
      userId: user.id,
      legalCategory,
      expectedCaseUpdatedAt,
      expectedDraftUpdatedAt,
      expectedSectionUpdatedAt,
      expectedSectionContent,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error generating AI draft section:', error);
    const mapped = toAiRouteError(error, 'ระบบเกิดข้อผิดพลาดในการสร้างร่างคำวินิจฉัย กรุณาลองใหม่อีกครั้ง');
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

