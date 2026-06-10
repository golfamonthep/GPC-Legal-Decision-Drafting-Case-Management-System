import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseThaiDate } from '@/lib/dateUtils';

export async function POST(request: Request) {
  try {
    const { validRows } = await request.json();
    if (!validRows || !Array.isArray(validRows)) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }

    const results = await prisma.$transaction(async (tx) => {
      let importedCount = 0;
      let skippedErrorCount = 0;
      let skippedDuplicateCount = 0;
      let warningImportedCount = 0;

      for (const row of validRows) {
        const data = row.data;

        // 1. Minimum import rule (hard error)
        const meaningfulFields = ['blackCaseNo', 'redCaseNo', 'complainantName', 'subject', 'accusedName', 'proceedingNote'];
        const hasMeaningful = meaningfulFields.some(k => data[k] && String(data[k]).trim() !== '');
        if (!hasMeaningful) {
          skippedErrorCount++;
          continue;
        }

        // 2. Duplicate Black Case No in DB (hard error if skipping)
        if (data.blackCaseNo) {
          const existing = await tx.case.findUnique({ where: { blackNumber: data.blackCaseNo } });
          if (existing) {
            skippedDuplicateCount++;
            continue;
          }
        }

        // Derive blackNumber if missing to satisfy DB constraint
        const blackNumber = data.blackCaseNo || `ไม่มีหมายเลขดำ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const receivedDate = parseThaiDate(data.receivedDate) || null;

        const newCase = await tx.case.create({
          data: {
            type: data.caseType || 'ไม่ระบุ',
            blackNumber: blackNumber,
            redNumber: data.redCaseNo || null,
            petitionerName: data.complainantName || 'ไม่ระบุ',
            respondentName: data.accusedName || 'ไม่ระบุ',
            subject: data.subject || 'ไม่ระบุ',
            legalCategory: 'ทั่วไป', // Default for imported cases
            legalOfficerName: data.legalOfficer || null,
            proceedingNote: data.proceedingNote || null,
            receivedDate: receivedDate,
            dueDate30: parseThaiDate(data.deadline30),
            dueDate60: parseThaiDate(data.deadline60),
            dueDate90: parseThaiDate(data.deadline90),
            dueDate120: parseThaiDate(data.deadline120),
            dueDate240: parseThaiDate(data.deadline240),
            currentStatus: data.status || 'อยู่ระหว่างดำเนินการ',
            meetingDate: parseThaiDate(data.meetingDate),
            decisionResult: data.decisionResult || null,
            oneDriveUrl: data.oneDriveUrl || null,
          }
        });

        await tx.caseEvent.create({
          data: {
            caseId: newCase.id,
            action: 'import_case',
            actorName: 'System Import',
          }
        });

        await tx.auditLog.create({
          data: {
            action: 'import_registry',
            entityType: 'Case',
            entityId: newCase.id,
            afterValue: JSON.stringify(data),
          }
        });

        importedCount++;
        if (row.status === 'warning') {
          warningImportedCount++;
        }
      }
      return { importedCount, skippedErrorCount, skippedDuplicateCount, warningImportedCount };
    });

    return NextResponse.json({ 
      success: true, 
      count: results.importedCount,
      importedCount: results.importedCount,
      skippedErrorCount: results.skippedErrorCount,
      skippedDuplicateCount: results.skippedDuplicateCount,
      warningImportedCount: results.warningImportedCount
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error.message }, { status: 500 });
  }
}
