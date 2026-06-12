import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { hasPermission } from '@/lib/auth/permissions';
import prisma from '@/lib/db';
import { checkFinalReadiness, updateFinalizationStatus } from '@/lib/finalization/caseFinalization';
import { PostMeetingFollowupStatus } from '@/lib/finalization/postMeetingFollowupStatus';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'FINALIZE_DECISION')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์จัดการงานหลังประชุม' }, { status: 403 });
  }

  try {
    const finalizationResult = await checkFinalReadiness(resolvedParams.id);
    const { ready, reasons } = finalizationResult;
    const { overrideReason } = await request.json();

    if (!ready && !overrideReason) {
      return NextResponse.json({ error: 'ยังไม่พร้อมจัดทำฉบับสุดท้าย', reasons }, { status: 400 });
    }

    if (!ready && overrideReason) {
       await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'FINALIZATION_OVERRIDE_USED',
          entityType: 'Case',
          entityId: params.id,
          afterValue: overrideReason,
        }
      });
    }

    await updateFinalizationStatus(
      resolvedParams.id,
      PostMeetingFollowupStatus.FINALIZED,
      {
        finalizedAt: new Date().toISOString(),
        finalizedByUserId: user.id,
      },
      user.name || "Unknown",
      user.id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to finalize decision' }, { status: 500 });
  }
}
