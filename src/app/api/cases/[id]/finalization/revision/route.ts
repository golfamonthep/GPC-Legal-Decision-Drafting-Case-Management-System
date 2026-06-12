import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { hasPermission } from '@/lib/auth/permissions';
import { updateFinalizationStatus } from '@/lib/finalization/caseFinalization';
import { PostMeetingFollowupStatus } from '@/lib/finalization/postMeetingFollowupStatus';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'MARK_DRAFT_REVISED')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์จัดการงานหลังประชุม' }, { status: 403 });
  }

  try {
    await updateFinalizationStatus(
      resolvedParams.id,
      PostMeetingFollowupStatus.REVISED_PENDING_REVIEW,
      {
        revisionCompletedAt: new Date().toISOString(),
        revisionCompletedByUserId: user.id,
      },
      user.name || "Unknown",
      user.id
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to mark revision completed' }, { status: 500 });
  }
}
