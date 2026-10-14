import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireApiPermission('VIEW_CASES');
    const summary = await prisma.case.aggregate({ _count: { id: true }, _max: { updatedAt: true } });
    return NextResponse.json({ revision: `${summary._count.id}:${summary._max.updatedAt?.toISOString() || ''}` }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ message: message === 'UNAUTHORIZED' ? 'กรุณาเข้าสู่ระบบ' : 'ไม่สามารถตรวจข้อมูลล่าสุดได้' }, { status: message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
