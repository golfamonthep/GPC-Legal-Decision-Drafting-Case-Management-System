import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import prisma from '@/lib/db';
import { parseThaiDate } from '@/lib/dateUtils';
import { hasRedCaseNumber, isClosedCaseStatus } from '@/lib/caseStatus';

const THAI_DIGITS: Record<string, string> = {
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
};

type NormalizedCaseType = 'ร้องทุกข์' | 'อุทธรณ์' | 'ไม่ระบุ';

type ExistingCaseRef = {
  id: string;
  type: string;
  blackNumber: string;
  redNumber: string | null;
};

function normalizeCaseType(value: unknown): NormalizedCaseType {
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
  const match = normalized.match(/\d+\/\d+/);
  return match?.[0] ?? null;
}

function compositeKey(caseType: string, caseNumber: string): string {
  return `${caseType}::${caseNumber}`;
}

function safeText(value: unknown): string {
  return String(value ?? '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiPermission('IMPORT_REGISTRY');
    const auditUserId = user.id.startsWith('mvp-') ? null : user.id;
    const { validRows } = await request.json();

    if (!Array.isArray(validRows)) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'รูปแบบข้อมูลไม่ถูกต้อง' },
        { status: 400 },
      );
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedErrorCount = 0;
    let skippedDuplicateCount = 0;
    let skippedConflictCount = 0;
    let warningImportedCount = 0;
    const failedRows: any[] = [];
    const messages: string[] = [];

    const normalizedInput = validRows.map((row: any) => {
      const data = row?.data ?? {};
      return {
        row,
        caseType: normalizeCaseType(data.caseType),
        blackNumber: normalizeCaseNumber(data.blackCaseNo),
        redNumber: extractStoredRedNumber(data.redCaseNo),
      };
    });

    const blackNumbersToCheck = Array.from(new Set(normalizedInput.map((item) => item.blackNumber).filter(Boolean)));
    const redNumbersToCheck = Array.from(new Set(normalizedInput.map((item) => item.redNumber).filter((value): value is string => Boolean(value))));

    const existingCases: ExistingCaseRef[] = blackNumbersToCheck.length > 0 || redNumbersToCheck.length > 0
      ? await prisma.case.findMany({
          where: {
            OR: [
              ...(blackNumbersToCheck.length > 0 ? [{ blackNumber: { in: blackNumbersToCheck } }] : []),
              ...(redNumbersToCheck.length > 0 ? [{ redNumber: { in: redNumbersToCheck } }] : []),
            ],
          },
          select: { id: true, type: true, blackNumber: true, redNumber: true },
        })
      : [];

    const existingByBlack = new Map<string, ExistingCaseRef>();
    const existingByRed = new Map<string, ExistingCaseRef>();

    existingCases.forEach((item) => {
      existingByBlack.set(compositeKey(item.type, normalizeCaseNumber(item.blackNumber)), item);
      if (item.redNumber) {
        existingByRed.set(compositeKey(item.type, normalizeCaseNumber(item.redNumber)), item);
      }
    });

    const seenPayloadBlack = new Set<string>();
    const seenPayloadRed = new Set<string>();

    const CHUNK_SIZE = 25;
    const chunks: typeof normalizedInput[] = [];
    for (let index = 0; index < normalizedInput.length; index += CHUNK_SIZE) {
      chunks.push(normalizedInput.slice(index, index + CHUNK_SIZE));
    }

    let chunkIndex = 0;
    for (const chunk of chunks) {
      chunkIndex += 1;
      const rowsToSynchronize: Array<{
        rowInfo: any;
        existing: ExistingCaseRef | null;
        caseData: Record<string, any>;
        blackKey: string;
        redKey: string;
      }> = [];

      for (const item of chunk) {
        const { row, caseType, blackNumber, redNumber } = item;
        const data = row?.data ?? {};

        if (row?.status === 'error') {
          skippedErrorCount += 1;
          messages.push(`แถวที่ ${row?.index ?? '-'}: ข้ามเนื่องจากข้อมูลไม่ผ่านการตรวจสอบ`);
          continue;
        }

        const meaningfulFields = ['blackCaseNo', 'redCaseNo', 'complainantName', 'subject', 'accusedName', 'proceedingNote'];
        const hasMeaningful = meaningfulFields.some((key) => data[key] && safeText(data[key]) !== '');
        if (!hasMeaningful || !blackNumber || caseType === 'ไม่ระบุ') {
          skippedErrorCount += 1;
          messages.push(`แถวที่ ${row?.index ?? '-'}: ข้ามเนื่องจากไม่มีประเภทเรื่องหรือหมายเลขดำที่ใช้ระบุตัวรายการ`);
          continue;
        }

        const blackKey = compositeKey(caseType, blackNumber);
        const redKey = redNumber ? compositeKey(caseType, redNumber) : '';

        if (seenPayloadBlack.has(blackKey)) {
          skippedDuplicateCount += 1;
          messages.push(`แถวที่ ${row?.index ?? '-'}: หมายเลขดำซ้ำภายในไฟล์ (${blackNumber})`);
          continue;
        }
        if (redKey && seenPayloadRed.has(redKey)) {
          skippedDuplicateCount += 1;
          messages.push(`แถวที่ ${row?.index ?? '-'}: หมายเลขแดงซ้ำภายในไฟล์ (${redNumber})`);
          continue;
        }

        const existing = existingByBlack.get(blackKey) ?? null;
        const redOwner = redKey ? existingByRed.get(redKey) : null;
        if (redOwner && redOwner.id !== existing?.id) {
          skippedConflictCount += 1;
          messages.push(`แถวที่ ${row?.index ?? '-'}: หมายเลขแดง ${redNumber} ถูกใช้โดยเรื่องอื่นในทะเบียน${caseType}`);
          continue;
        }

        seenPayloadBlack.add(blackKey);
        if (redKey) seenPayloadRed.add(redKey);

        const rawRedCaseNo = normalizeCaseNumber(data.redCaseNo);
        const importedStatus = safeText(data.status).replace(/\s+/g, ' ');
        const completedByRedNumber = hasRedCaseNumber(rawRedCaseNo);
        const currentStatus = completedByRedNumber && !isClosedCaseStatus(importedStatus)
          ? 'เสร็จสิ้น'
          : importedStatus || 'อยู่ระหว่างดำเนินการ';

        rowsToSynchronize.push({
          rowInfo: row,
          existing,
          blackKey,
          redKey,
          caseData: {
            type: caseType,
            blackNumber,
            redNumber,
            petitionerName: safeText(data.complainantName) || 'ไม่ระบุ',
            respondentName: safeText(data.accusedName) || 'ไม่ระบุ',
            subject: safeText(data.subject) || 'ไม่ระบุ',
            legalCategory: caseType === 'อุทธรณ์' ? 'อุทธรณ์คำสั่ง' : 'ร้องทุกข์',
            legalOfficerName: safeText(data.legalOfficer) || null,
            committeeOwnerName: safeText(data.commissioner) || null,
            proceedingNote: safeText(data.proceedingNote) || null,
            receivedDate: parseThaiDate(data.receivedDate),
            dueDate30: parseThaiDate(data.deadline30),
            dueDate60: parseThaiDate(data.deadline60),
            dueDate90: parseThaiDate(data.deadline90),
            dueDate120: parseThaiDate(data.deadline120),
            dueDate240: parseThaiDate(data.deadline240),
            currentStatus,
            meetingDate: parseThaiDate(data.meetingDate),
            decisionResult: safeText(data.decisionResult) || null,
            oneDriveUrl: safeText(data.oneDriveUrl) || null,
          },
        });
      }

      if (rowsToSynchronize.length === 0) continue;

      try {
        const synchronized = await prisma.$transaction(async (transaction) => {
          const results: Array<{ id: string; inserted: boolean; item: typeof rowsToSynchronize[number] }> = [];

          for (const item of rowsToSynchronize) {
            const caseRecord = item.existing
              ? await transaction.case.update({ where: { id: item.existing.id }, data: item.caseData })
              : await transaction.case.create({ data: item.caseData as any });

            await transaction.caseEvent.create({
              data: {
                caseId: caseRecord.id,
                action: item.existing ? 'sync_latest_registry_update' : 'import_case',
                actorName: user.name || 'System Import',
              },
            });

            await transaction.auditLog.create({
              data: {
                userId: auditUserId,
                action: item.existing ? 'sync_registry_update' : 'import_registry',
                entityType: 'Case',
                entityId: caseRecord.id,
                afterValue: JSON.stringify(item.rowInfo.data),
              },
            });

            results.push({ id: caseRecord.id, inserted: !item.existing, item });
          }

          return results;
        }, { timeout: 30000, maxWait: 10000 });

        synchronized.forEach((result) => {
          if (result.inserted) {
            insertedCount += 1;
          } else {
            updatedCount += 1;
          }
          if (result.item.rowInfo.status === 'warning') warningImportedCount += 1;

          const reference: ExistingCaseRef = {
            id: result.id,
            type: result.item.caseData.type,
            blackNumber: result.item.caseData.blackNumber,
            redNumber: result.item.caseData.redNumber,
          };
          existingByBlack.set(result.item.blackKey, reference);
          if (result.item.redKey) existingByRed.set(result.item.redKey, reference);
        });
      } catch (transactionError) {
        console.error(`Transaction error in registry synchronization chunk ${chunkIndex}:`, transactionError);
        rowsToSynchronize.forEach((item) => {
          failedRows.push(item.rowInfo);
          messages.push(`แถวที่ ${item.rowInfo?.index ?? '-'}: ซิงก์ข้อมูลไม่สำเร็จเนื่องจากข้อผิดพลาดในระบบ`);
        });
      }
    }

    const synchronizedCount = insertedCount + updatedCount;

    return NextResponse.json({
      success: true,
      totalRows: validRows.length,
      importableRows: validRows.length - skippedErrorCount,
      importedRows: synchronizedCount,
      insertedRows: insertedCount,
      updatedRows: updatedCount,
      importedWarningRows: warningImportedCount,
      skippedErrorRows: skippedErrorCount,
      skippedDuplicateRows: skippedDuplicateCount,
      skippedConflictRows: skippedConflictCount,
      failedRows: failedRows.length,
      messages,
      batchCount: chunks.length,
      count: synchronizedCount,
      importedCount: synchronizedCount,
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
