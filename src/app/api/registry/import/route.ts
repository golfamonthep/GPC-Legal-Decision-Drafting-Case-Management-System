import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import prisma from '@/lib/db';
import { parseThaiDate } from '@/lib/dateUtils';
import { hasRedCaseNumber, isClosedCaseStatus } from '@/lib/caseStatus';

const THAI_DIGITS: Record<string, string> = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
};

function normalizeCaseType(value: unknown): 'ร้องทุกข์' | 'อุทธรณ์' | 'ไม่ระบุ' {
  const normalized = String(value ?? '').replace(/\s+/g, '').trim();
  if (normalized.includes('อุทธรณ์')) return 'อุทธรณ์';
  if (normalized.includes('ร้องทุกข์')) return 'ร้องทุกข์';
  return 'ไม่ระบุ';
}

function normalizeCaseNumber(value: unknown): string {
  return String(value ?? '')
    .replace(/[๐-๙]/g, (digit) => THAI_DIGITS[digit] ?? digit)
    .replace(/\s+/g, '')
    .trim();
}

function extractStoredRedNumber(value: unknown): string | null {
  const normalized = normalizeCaseNumber(value);
  if (!normalized) return null;

  // “แดงแล้ว” is a completion marker, not a unique red-case number.
  // Store only an actual number such as 74/69 or 2/2568.
  const match = normalized.match(/\d+\/\d+/);
  return match?.[0] ?? null;
}

function compositeKey(caseType: string, caseNumber: string): string {
  return `${caseType}::${caseNumber}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiPermission('IMPORT_REGISTRY');
    const auditUserId = user.id.startsWith('mvp-') ? null : user.id;
    const { validRows } = await request.json();

    if (!validRows || !Array.isArray(validRows)) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 },
      );
    }

    let importedCount = 0;
    let skippedErrorCount = 0;
    let skippedDuplicateCount = 0;
    let warningImportedCount = 0;
    const failedRows: any[] = [];
    const messages: string[] = [];

    const blackNumbersToCheck = new Set<string>();
    const redNumbersToCheck = new Set<string>();

    validRows.forEach((row: any) => {
      const blackNumber = normalizeCaseNumber(row?.data?.blackCaseNo);
      const redNumber = extractStoredRedNumber(row?.data?.redCaseNo);
      if (blackNumber) blackNumbersToCheck.add(blackNumber);
      if (redNumber) redNumbersToCheck.add(redNumber);
    });

    const existingCases = blackNumbersToCheck.size > 0 || redNumbersToCheck.size > 0
      ? await prisma.case.findMany({
          where: {
            OR: [
              ...(blackNumbersToCheck.size > 0
                ? [{ blackNumber: { in: Array.from(blackNumbersToCheck) } }]
                : []),
              ...(redNumbersToCheck.size > 0
                ? [{ redNumber: { in: Array.from(redNumbersToCheck) } }]
                : []),
            ],
          },
          select: { type: true, blackNumber: true, redNumber: true },
        })
      : [];

    const existingBlackKeys = new Set(
      existingCases.map((item) => compositeKey(item.type, normalizeCaseNumber(item.blackNumber))),
    );
    const existingRedKeys = new Set(
      existingCases
        .filter((item) => Boolean(item.redNumber))
        .map((item) => compositeKey(item.type, normalizeCaseNumber(item.redNumber))),
    );

    const CHUNK_SIZE = 25;
    const chunks: any[][] = [];
    for (let index = 0; index < validRows.length; index += CHUNK_SIZE) {
      chunks.push(validRows.slice(index, index + CHUNK_SIZE));
    }

    let chunkIndex = 0;
    for (const chunk of chunks) {
      chunkIndex += 1;
      const rowsToInsert: any[] = [];

      for (const row of chunk) {
        if (row.status === 'error') {
          skippedErrorCount += 1;
          messages.push(`แถวที่ ${row.index}: ข้ามเนื่องจากข้อมูลไม่ผ่านการตรวจสอบ`);
          continue;
        }

        const data = row.data ?? {};
        const meaningfulFields = ['blackCaseNo', 'redCaseNo', 'complainantName', 'subject', 'accusedName', 'proceedingNote'];
        const hasMeaningful = meaningfulFields.some((key) => data[key] && String(data[key]).trim() !== '');
        if (!hasMeaningful) {
          skippedErrorCount += 1;
          messages.push(`แถวที่ ${row.index}: ข้ามเนื่องจากไม่มีข้อมูลสำคัญ`);
          continue;
        }

        const caseType = normalizeCaseType(data.caseType);
        const blackCaseNo = normalizeCaseNumber(data.blackCaseNo);
        const rawRedCaseNo = normalizeCaseNumber(data.redCaseNo);
        const storedRedCaseNo = extractStoredRedNumber(data.redCaseNo);
        const blackKey = blackCaseNo ? compositeKey(caseType, blackCaseNo) : '';
        const redKey = storedRedCaseNo ? compositeKey(caseType, storedRedCaseNo) : '';

        if (blackKey && existingBlackKeys.has(blackKey)) {
          skippedDuplicateCount += 1;
          messages.push(`แถวที่ ${row.index}: ข้ามเนื่องจากมีหมายเลขดำซ้ำในทะเบียน${caseType} (${blackCaseNo})`);
          continue;
        }
        if (redKey && existingRedKeys.has(redKey)) {
          skippedDuplicateCount += 1;
          messages.push(`แถวที่ ${row.index}: ข้ามเนื่องจากมีหมายเลขแดงซ้ำในทะเบียน${caseType} (${storedRedCaseNo})`);
          continue;
        }

        if (blackKey) existingBlackKeys.add(blackKey);
        if (redKey) existingRedKeys.add(redKey);

        const blackNumber = blackCaseNo || `ไม่มีหมายเลขดำ-${caseType}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const importedStatus = String(data.status ?? '').trim();
        const completedByRedNumber = hasRedCaseNumber(rawRedCaseNo);
        const currentStatus = completedByRedNumber && !isClosedCaseStatus(importedStatus)
          ? 'เสร็จสิ้น'
          : importedStatus || 'อยู่ระหว่างดำเนินการ';

        rowsToInsert.push({
          rowInfo: row,
          caseData: {
            type: caseType,
            blackNumber,
            redNumber: storedRedCaseNo,
            petitionerName: String(data.complainantName ?? '').trim() || 'ไม่ระบุ',
            respondentName: String(data.accusedName ?? '').trim() || 'ไม่ระบุ',
            subject: String(data.subject ?? '').trim() || 'ไม่ระบุ',
            legalCategory: caseType === 'อุทธรณ์' ? 'อุทธรณ์คำสั่ง' : 'ร้องทุกข์',
            legalOfficerName: String(data.legalOfficer ?? '').trim() || null,
            committeeOwnerName: String(data.commissioner ?? '').trim() || null,
            proceedingNote: String(data.proceedingNote ?? '').trim() || null,
            receivedDate: parseThaiDate(data.receivedDate),
            dueDate30: parseThaiDate(data.deadline30),
            dueDate60: parseThaiDate(data.deadline60),
            dueDate90: parseThaiDate(data.deadline90),
            dueDate120: parseThaiDate(data.deadline120),
            dueDate240: parseThaiDate(data.deadline240),
            currentStatus,
            meetingDate: parseThaiDate(data.meetingDate),
            decisionResult: String(data.decisionResult ?? '').trim() || null,
            oneDriveUrl: String(data.oneDriveUrl ?? '').trim() || null,
          },
        });
      }

      if (rowsToInsert.length === 0) continue;

      try {
        await prisma.$transaction(async (transaction) => {
          for (const item of rowsToInsert) {
            const newCase = await transaction.case.create({ data: item.caseData });

            await transaction.caseEvent.create({
              data: {
                caseId: newCase.id,
                action: 'import_case',
                actorName: user.name || 'System Import',
              },
            });

            await transaction.auditLog.create({
              data: {
                userId: auditUserId,
                action: 'import_registry',
                entityType: 'Case',
                entityId: newCase.id,
                afterValue: JSON.stringify(item.rowInfo.data),
              },
            });
          }
        }, { timeout: 30000, maxWait: 10000 });

        for (const item of rowsToInsert) {
          importedCount += 1;
          if (item.rowInfo.status === 'warning') warningImportedCount += 1;
        }
      } catch (transactionError: any) {
        console.error(`Transaction error in chunk ${chunkIndex}:`, transactionError);
        for (const item of rowsToInsert) {
          failedRows.push(item.rowInfo);
          messages.push(`แถวที่ ${item.rowInfo.index}: นำเข้าไม่สำเร็จเนื่องจากข้อผิดพลาดในระบบ`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalRows: validRows.length,
      importableRows: validRows.length - skippedErrorCount,
      importedRows: importedCount,
      importedWarningRows: warningImportedCount,
      skippedErrorRows: skippedErrorCount,
      skippedDuplicateRows: skippedDuplicateCount,
      failedRows: failedRows.length,
      messages,
      batchCount: chunks.length,
      count: importedCount,
      importedCount,
      warningImportedCount,
    });
  } catch (error: any) {
    console.error('Registry import error:', error);

    if (error?.message === 'FORBIDDEN') {
      return NextResponse.json(
        { success: false, code: 'PERMISSION_ERROR', message: 'คุณไม่มีสิทธิ์ดำเนินการนี้' },
        { status: 403 },
      );
    }
    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json(
        { success: false, code: 'PERMISSION_ERROR', message: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { success: false, code: 'DATABASE_ERROR', message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล กรุณาลองใหม่อีกครั้ง' },
      { status: 500 },
    );
  }
}
