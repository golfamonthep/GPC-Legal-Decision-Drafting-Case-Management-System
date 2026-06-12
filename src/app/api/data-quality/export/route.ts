import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { detectCaseDataQualityIssues } from '@/lib/dataQuality/caseDataQuality';

export async function GET(request: Request) {
  try {
    const user = await requireApiPermission('EXPORT_DATA_QUALITY_REPORT');
    if (!user) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ส่งออกรายงานคุณภาพข้อมูล' }, { status: 403 });
    }

    const cases = await prisma.case.findMany({
      include: {
        events: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    const allIssues = [];

    // Evaluate single-case rules
    for (const c of cases) {
      const issues = detectCaseDataQualityIssues(c);
      allIssues.push(...issues);
    }

    // CSV Header
    let csv = '\uFEFF'; // BOM for Excel UTF-8 support
    csv += 'ระดับความรุนแรง,หมวดหมู่,หัวข้อปัญหา,เลขดำ,เลขแดง,ประเภทสำนวน,ผู้ร้อง/ผู้อุทธรณ์,ผู้ถูกร้อง/ผู้ถูกอุทธรณ์,เรื่อง,ฟิลด์ที่มีปัญหา,ค่าปัจจุบัน,ข้อเสนอแนะ\n';

    for (const issue of allIssues) {
      const row = [
        issue.severity,
        issue.category,
        issue.title,
        issue.caseBlackNumber,
        issue.caseRedNumber || '',
        issue.caseType,
        issue.petitionerName,
        issue.respondentName,
        issue.subject,
        issue.fieldName || '',
        issue.currentValue || '',
        issue.recommendedAction || ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      
      csv += row + '\n';
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DATA_QUALITY_REPORT_EXPORTED',
        entityType: 'Report',
        entityId: 'DATA_QUALITY',
      }
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="data-quality-report.csv"',
      },
    });

  } catch (error: any) {
    console.error('Error exporting data quality report:', error);
    return NextResponse.json({ error: 'ไม่สามารถส่งออกรายงานคุณภาพข้อมูลได้' }, { status: 500 });
  }
}
