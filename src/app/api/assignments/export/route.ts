import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { calculateWorkload } from '@/lib/assignments/caseAssignment';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await requireApiPermission("EXPORT_WORKLOAD_REPORT");
    
    const workload = await calculateWorkload();

    // Generate CSV
    const rows: string[] = [];
    
    // Header for Legal Officers
    rows.push('--- นิติกร ---');
    rows.push('ชื่อ,รวมทั้งหมด,Active,เกินกำหนด,ใกล้ครบกำหนด,สำนวนเสร็จสิ้น,ยังไม่มีเลขแดง');
    workload.legalOfficers.forEach(lo => {
      rows.push(`"${lo.name}",${lo.totalCases},${lo.activeCases},${lo.overdueCases},${lo.nearDueCases},${lo.completedCases},${lo.noRedNumber}`);
    });
    
    rows.push(''); // Empty line

    // Header for Committee Owners
    rows.push('--- กรรมการเจ้าของสำนวน ---');
    rows.push('ชื่อ,รวมทั้งหมด,Active,เกินกำหนด,ใกล้ครบกำหนด,สำนวนเสร็จสิ้น,ยังไม่มีเลขแดง');
    workload.committeeOwners.forEach(co => {
      rows.push(`"${co.name}",${co.totalCases},${co.activeCases},${co.overdueCases},${co.nearDueCases},${co.completedCases},${co.noRedNumber}`);
    });

    const csvContent = '\uFEFF' + rows.join('\n'); // Add BOM for Excel Thai support

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'WORKLOAD_REPORT_EXPORTED',
        entityType: 'System',
        entityId: 'assignments',
      }
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="workload_report_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error('Export Workload Error:', error);
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ดาวน์โหลดรายงานนี้' }, { status: 403 });
    }
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    return NextResponse.json({ error: 'ไม่สามารถออกรายงานได้' }, { status: 500 });
  }
}
