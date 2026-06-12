import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import { detectCaseDataQualityIssues } from '@/lib/dataQuality/caseDataQuality';
import { DataQualityIssue } from '@/lib/dataQuality/types';

export async function GET(request: Request) {
  try {
    const user = await requireApiPermission('VIEW_DATA_QUALITY');
    if (!user) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์เข้าถึงหน้าตรวจคุณภาพข้อมูล' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const severityParam = searchParams.get('severity');

    const cases = await prisma.case.findMany({
      include: {
        events: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    let allIssues: DataQualityIssue[] = [];

    // Evaluate single-case rules
    for (const c of cases) {
      const issues = detectCaseDataQualityIssues(c);
      allIssues.push(...issues);
    }

    // Evaluate cross-case rules (Duplicate risk)
    const blackNumberCounts = new Map<string, string[]>();
    const redNumberCounts = new Map<string, string[]>();

    for (const c of cases) {
      if (c.blackNumber && c.blackNumber.trim() !== '') {
        const blk = c.blackNumber.trim();
        if (!blackNumberCounts.has(blk)) blackNumberCounts.set(blk, []);
        blackNumberCounts.get(blk)!.push(c.id);
      }
      if (c.redNumber && c.redNumber.trim() !== '') {
        const red = c.redNumber.trim();
        if (!redNumberCounts.has(red)) redNumberCounts.set(red, []);
        redNumberCounts.get(red)!.push(c.id);
      }
    }

    for (const c of cases) {
      if (c.blackNumber && c.blackNumber.trim() !== '') {
        const duplicates = blackNumberCounts.get(c.blackNumber.trim());
        if (duplicates && duplicates.length > 1) {
          allIssues.push({
            id: `${c.id}_duplicate_black`,
            caseId: c.id,
            category: 'DUPLICATE_RISK',
            severity: 'CRITICAL',
            title: 'เรื่องดำซ้ำ',
            description: `พบสำนวนที่มีเลขเรื่องดำ ${c.blackNumber} ซ้ำกัน`,
            fieldName: 'blackNumber',
            currentValue: c.blackNumber,
            recommendedAction: 'ตรวจสอบสำนวนซ้ำ',
            caseBlackNumber: c.blackNumber,
            caseRedNumber: c.redNumber,
            caseType: c.type,
            petitionerName: c.petitionerName,
            respondentName: c.respondentName,
            subject: c.subject,
            legalOfficerName: c.legalOfficerName,
            ownerId: c.ownerId,
          });
        }
      }
      if (c.redNumber && c.redNumber.trim() !== '') {
        const duplicates = redNumberCounts.get(c.redNumber.trim());
        if (duplicates && duplicates.length > 1) {
          allIssues.push({
            id: `${c.id}_duplicate_red`,
            caseId: c.id,
            category: 'DUPLICATE_RISK',
            severity: 'CRITICAL',
            title: 'เรื่องแดงซ้ำ',
            description: `พบสำนวนที่มีเลขเรื่องแดง ${c.redNumber} ซ้ำกัน`,
            fieldName: 'redNumber',
            currentValue: c.redNumber,
            recommendedAction: 'ตรวจสอบสำนวนซ้ำ',
            caseBlackNumber: c.blackNumber,
            caseRedNumber: c.redNumber,
            caseType: c.type,
            petitionerName: c.petitionerName,
            respondentName: c.respondentName,
            subject: c.subject,
            legalOfficerName: c.legalOfficerName,
            ownerId: c.ownerId,
          });
        }
      }
    }

    if (severityParam) {
      allIssues = allIssues.filter(issue => issue.severity === severityParam);
    }

    return NextResponse.json({ issues: allIssues });

  } catch (error: any) {
    console.error('Error fetching data quality issues:', error);
    return NextResponse.json({ error: 'ไม่สามารถโหลดรายการปัญหาคุณภาพข้อมูลได้' }, { status: 500 });
  }
}
