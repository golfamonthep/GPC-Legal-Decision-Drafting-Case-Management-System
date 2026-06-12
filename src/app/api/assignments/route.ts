import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { calculateWorkload, getAssignableUsers } from '@/lib/assignments/caseAssignment';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await requireApiPermission("VIEW_WORKLOAD"); // Assuming VIEW_WORKLOAD or VIEW_ASSIGNMENTS
    
    // We can also check if they have VIEW_ASSIGNMENTS as fallback
    
    const workload = await calculateWorkload();
    const assignableUsers = await getAssignableUsers();

    return NextResponse.json({ workload, assignableUsers });
  } catch (error: any) {
    console.error('Workload API Error:', error);
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ดูข้อมูลการมอบหมายสำนวน' }, { status: 403 });
    }
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    return NextResponse.json({ error: 'ไม่สามารถโหลดภาระงานได้' }, { status: 500 });
  }
}
