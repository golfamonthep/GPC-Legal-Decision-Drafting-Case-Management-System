import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db';
import { updateFinalizationStatus } from '@/lib/finalization/caseFinalization';
import { PostMeetingFollowupStatus } from '@/lib/finalization/postMeetingFollowupStatus';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'CLOSE_CASE_AFTER_DECISION')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์จัดการงานหลังประชุม' }, { status: 403 });
  }

  try {
    const { closureNote } = await request.json();

    await prisma.case.update({
      where: { id: resolvedParams.id },
      data: { currentStatus: 'เสร็จสิ้น' }
    });

    await updateFinalizationStatus(
      resolvedParams.id,
      PostMeetingFollowupStatus.CLOSED,
      {
        closedAt: new Date().toISOString(),
        closedByUserId: user.id,
        closureNote
      },
      user.name || "Unknown",
      user.id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'ไม่สามารถปิดสำนวนได้ กรุณาตรวจสอบเงื่อนไข' }, { status: 500 });
  }
}
