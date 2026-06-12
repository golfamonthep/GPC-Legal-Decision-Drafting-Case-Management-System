import { NextResponse, NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db';
import { getCaseFinalization } from '@/lib/finalization/caseFinalization';
import { PostMeetingFollowupStatus } from '@/lib/finalization/postMeetingFollowupStatus';
import { generateDecisionDocx } from "@/lib/export/decisionDocxExport";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'EXPORT_FINAL_DECISION_DOCX')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ดูงานหลังประชุม' }, { status: 403 });
  }

  try {
    const { finalizationData } = await getCaseFinalization(resolvedParams.id);
    
    // Check if finalized
    const isFinalized = finalizationData && finalizationData.status === PostMeetingFollowupStatus.FINALIZED;
    
    // We don't need to fetch caseRecord sections here, generateDecisionDocx handles it.
    const caseRecord = await prisma.case.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!caseRecord) {
      return NextResponse.json({ error: 'ไม่พบร่างคำวินิจฉัย' }, { status: 404 });
    }

    const titlePrefix = isFinalized ? "คำวินิจฉัยฉบับสมบูรณ์" : "ร่างคำวินิจฉัยหลังประชุม";
    const filename = `${titlePrefix}_${resolvedParams.id}.docx`;

    // Re-use existing DOCX export infrastructure
    const result = await generateDecisionDocx(resolvedParams.id);
    const buffer = result.buffer;

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FINAL_DECISION_DOCX_EXPORTED',
        entityType: 'Case',
        entityId: resolvedParams.id,
        afterValue: filename,
      }
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'ไม่สามารถส่งออก DOCX ฉบับสุดท้ายได้' }, { status: 500 });
  }
}
