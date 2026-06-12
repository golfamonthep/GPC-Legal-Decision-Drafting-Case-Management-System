import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { hasPermission } from '@/lib/auth/permissions';
import { getCaseFinalization, initializeFinalization } from '@/lib/finalization/caseFinalization';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'VIEW_POST_MEETING_FOLLOWUP')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ดูงานหลังประชุม' }, { status: 403 });
  }

  try {
    const data = await getCaseFinalization(resolvedParams.id);
    return NextResponse.json(data.finalizationData || { status: 'NOT_STARTED' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'ไม่พบสำนวน' }, { status: 404 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, 'MANAGE_POST_MEETING_FOLLOWUP')) {
    return NextResponse.json({ error: 'คุณไม่มีสิทธิ์จัดการงานหลังประชุม' }, { status: 403 });
  }

  try {
    const body = await request.json();
    await initializeFinalization(resolvedParams.id, body.meetingAgendaItemId, body.boardResult, body.instruction);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to initialize finalization' }, { status: 500 });
  }
}
