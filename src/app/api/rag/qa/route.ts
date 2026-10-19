import { NextResponse } from 'next/server';
import { generateLegalAnswer, GenerateQaOptions } from '@/lib/ai/legalQa';
import { toAiRouteError } from '@/lib/ai/revisionGuard';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { getAiHarnessStatus } from '../../../../../shared/ai-harness.mjs';

export async function GET() {
  try {
    await requireApiPermission('USE_AI_REVIEW');
    const status = getAiHarnessStatus();
    return NextResponse.json({
      ready: status.enabled && status.configured,
      provider: status.provider,
      model: status.model,
      reason: status.reason,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    if (error.message === 'FORBIDDEN') return NextResponse.json({error: 'Forbidden'}, {status: 403});
    return NextResponse.json({error: 'Unavailable'}, {status: 503});
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiPermission('USE_AI_REVIEW');

    const body = await request.json();
    const {
      query,
      mode,
      filters,
      topK,
      caseId,
      draftId,
      sectionId,
      expectedCaseUpdatedAt,
      expectedDraftUpdatedAt,
      expectedSectionUpdatedAt,
      expectedSectionContent,
    } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const options: GenerateQaOptions = {
      query: query.trim(),
      mode: mode || "hybrid",
      filters,
      topK: topK || 5,
      userId: user.id,
      caseId,
      draftId,
      sectionId,
      expectedCaseUpdatedAt,
      expectedDraftUpdatedAt,
      expectedSectionUpdatedAt,
      expectedSectionContent,
    };

    const result = await generateLegalAnswer(options);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("QA error:", error);
    const mapped = toAiRouteError(error, "ระบบเกิดข้อผิดพลาดในการประมวลผลคำตอบ กรุณาลองใหม่อีกครั้ง");
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

