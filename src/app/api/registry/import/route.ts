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
      const importedCases = [];
      for (const row of validRows) {
        const data = row.data;

        // Parse dates safely
        const receivedDate = parseThaiDate(data.receivedDate);
        if (!receivedDate) {
          throw new Error(`รูปแบบวันที่รับเรื่องไม่ถูกต้องในแถวที่ ${row.index}`);
        }

        const newCase = await tx.case.create({
          data: {
            type: data.caseType,
            blackNumber: data.blackCaseNo,
            redNumber: data.redCaseNo || null,
            petitionerName: data.complainantName,
            respondentName: data.accusedName || 'ไม่ระบุ',
            subject: data.subject,
            legalCategory: 'ทั่วไป', // Default for imported cases
            receivedDate: receivedDate,
            dueDate30: parseThaiDate(data.deadline30),
            dueDate60: parseThaiDate(data.deadline60),
            dueDate90: parseThaiDate(data.deadline90),
            dueDate120: parseThaiDate(data.deadline120),
            dueDate240: parseThaiDate(data.deadline240),
            currentStatus: data.status || 'รอดำเนินการ',
            meetingDate: parseThaiDate(data.meetingDate),
            decisionResult: data.decisionResult || null,
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

        importedCases.push(newCase);
      }
      return importedCases;
    });

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error.message }, { status: 500 });
  }
}
