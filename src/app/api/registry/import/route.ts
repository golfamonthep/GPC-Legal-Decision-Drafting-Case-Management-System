import { NextRequest, NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import prisma from '@/lib/db';
import { parseThaiDate } from '@/lib/dateUtils';

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiPermission("IMPORT_REGISTRY");
    const { validRows } = await request.json();
    if (!validRows || !Array.isArray(validRows)) {
      return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }

    let importedCount = 0;
    let skippedErrorCount = 0;
    let skippedDuplicateCount = 0;
    let warningImportedCount = 0;
    const failedRows: any[] = [];
    const messages: string[] = [];

    // 1. Pre-processing and Duplicate Check
    const blackNumbersToCheck = new Set<string>();
    const redNumbersToCheck = new Set<string>();

    validRows.forEach((row: any) => {
      if (row.data.blackCaseNo) blackNumbersToCheck.add(row.data.blackCaseNo);
      if (row.data.redCaseNo) redNumbersToCheck.add(row.data.redCaseNo);
    });

    const existingBlackCases = await prisma.case.findMany({
      where: {
        blackNumber: { in: Array.from(blackNumbersToCheck) }
      },
      select: { blackNumber: true }
    });

    const existingRedCases = await prisma.case.findMany({
      where: {
        redNumber: { in: Array.from(redNumbersToCheck) }
      },
      select: { redNumber: true }
    });

    const existingBlackNumbers = new Set(existingBlackCases.map(c => c.blackNumber));
    const existingRedNumbers = new Set(existingRedCases.map(c => c.redNumber).filter(Boolean));

    // 2. Chunking rows for transactions
    const CHUNK_SIZE = 25;
    const chunks = [];
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      chunks.push(validRows.slice(i, i + CHUNK_SIZE));
    }

    let chunkIndex = 0;
    for (const chunk of chunks) {
      chunkIndex++;
      const rowsToInsert: any[] = [];

      for (const row of chunk) {
        const data = row.data;

        // Minimum import rule (hard error)
        const meaningfulFields = ['blackCaseNo', 'redCaseNo', 'complainantName', 'subject', 'accusedName', 'proceedingNote'];
        const hasMeaningful = meaningfulFields.some(k => data[k] && String(data[k]).trim() !== '');
        if (!hasMeaningful) {
          skippedErrorCount++;
          messages.push(`แถวที่ ${row.index}: ข้ามเนื่องจากไม่มีข้อมูลสำคัญ`);
          continue;
        }

        // Duplicate Check
        if (data.blackCaseNo && existingBlackNumbers.has(data.blackCaseNo)) {
          skippedDuplicateCount++;
          messages.push(`แถวที่ ${row.index}: ข้ามเนื่องจากมีหมายเลขดำซ้ำ (${data.blackCaseNo})`);
          continue;
        }
        if (data.redCaseNo && existingRedNumbers.has(data.redCaseNo)) {
          skippedDuplicateCount++;
          messages.push(`แถวที่ ${row.index}: ข้ามเนื่องจากมีหมายเลขแดงซ้ำ (${data.redCaseNo})`);
          continue;
        }

        // Add to existing numbers in memory to prevent duplicates within the same import payload
        if (data.blackCaseNo) existingBlackNumbers.add(data.blackCaseNo);
        if (data.redCaseNo) existingRedNumbers.add(data.redCaseNo);

        const blackNumber = data.blackCaseNo || `ไม่มีหมายเลขดำ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const receivedDate = parseThaiDate(data.receivedDate) || null;

        rowsToInsert.push({
          rowInfo: row,
          caseData: {
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
            dueDate30: parseThaiDate(data.deadline30) || null,
            dueDate60: parseThaiDate(data.deadline60) || null,
            dueDate90: parseThaiDate(data.deadline90) || null,
            dueDate120: parseThaiDate(data.deadline120) || null,
            dueDate240: parseThaiDate(data.deadline240) || null,
            currentStatus: data.status || 'อยู่ระหว่างดำเนินการ',
            meetingDate: parseThaiDate(data.meetingDate) || null,
            decisionResult: data.decisionResult || null,
            oneDriveUrl: data.oneDriveUrl || null,
          }
        });
      }

      if (rowsToInsert.length === 0) continue;

      // 3. Transaction per chunk
      try {
        await prisma.$transaction(async (tx) => {
          for (const item of rowsToInsert) {
            const newCase = await tx.case.create({
              data: item.caseData
            });

            await tx.caseEvent.create({
              data: {
                caseId: newCase.id,
                action: 'import_case',
                actorName: user.name || 'System Import',
              }
            });

            await tx.auditLog.create({
              data: {
                userId: user.id,
                action: 'import_registry',
                entityType: 'Case',
                entityId: newCase.id,
                afterValue: JSON.stringify(item.rowInfo.data),
              }
            });
          }
        }, { timeout: 30000, maxWait: 10000 });

        // Update counts on successful transaction
        for (const item of rowsToInsert) {
          importedCount++;
          if (item.rowInfo.status === 'warning') {
            warningImportedCount++;
          }
        }
      } catch (txError: any) {
        console.error(`Transaction error in chunk ${chunkIndex}:`, txError);
        // If a transaction fails, we record those rows as failed and continue with the next chunk
        for (const item of rowsToInsert) {
          failedRows.push(item.rowInfo);
          messages.push(`แถวที่ ${item.rowInfo.index}: นำเข้าไม่สำเร็จเนื่องจากข้อผิดพลาดในระบบ`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      totalRows: validRows.length,
      importableRows: validRows.length,
      importedRows: importedCount,
      importedWarningRows: warningImportedCount,
      skippedErrorRows: skippedErrorCount,
      skippedDuplicateRows: skippedDuplicateCount,
      failedRows: failedRows.length,
      messages: messages,
      batchCount: chunks.length,
      // Keep these for backward compatibility if needed elsewhere
      count: importedCount,
      importedCount: importedCount,
      warningImportedCount: warningImportedCount,
    });
  } catch (error: any) {
    console.error('Registry import error:', error);
    if (error?.message === "FORBIDDEN") {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ดำเนินการนี้' }, { status: 403 });
    }
    if (error?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
