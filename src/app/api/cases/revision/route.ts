import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { getCaseRevision } from '@/lib/caseRevision';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireApiPermission('VIEW_CASES');
    return NextResponse.json({ revision: await getCaseRevision() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ message: message === 'UNAUTHORIZED' ? 'กรุณาเข้าสู่ระบบ' : 'ไม่สามารถตรวจข้อมูลล่าสุดได้' }, { status: message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
