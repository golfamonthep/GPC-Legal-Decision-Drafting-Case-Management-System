import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db';
import { updateFinalizationStatus } from '@/lib/finalization/caseFinalization';
import { PostMeetingFollowupStatus } from '@/lib/finalization/postMeetingFollowupStatus';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'RECORD_RED_CASE_NUMBER')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์จัดการงานหลังประชุม' }, { status: 403 });
  }

  try {
    const { redNumber } = await request.json();
    if (!redNumber || redNumber.trim() === '') {
      return NextResponse.json({ error: 'ยังไม่สามารถบันทึกเลขแดงได้ กรุณาตรวจสอบข้อมูล' }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.case.findFirst({
      where: { redNumber }
    });
    
    if (existing && existing.id !== resolvedParams.id) {
      return NextResponse.json({ error: 'เลขแดงนี้อาจซ้ำกับสำนวนอื่น' }, { status: 400 });
    }

    await prisma.case.update({
      where: { id: resolvedParams.id },
      data: { redNumber }
    });

    await updateFinalizationStatus(
      resolvedParams.id,
      PostMeetingFollowupStatus.RED_NUMBER_RECORDED,
      {
        redCaseNumberRecordedAt: new Date().toISOString(),
        redCaseNumberRecordedByUserId: user.id,
      },
      user.name || "Unknown",
      user.id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to record red number' }, { status: 500 });
  }
}
