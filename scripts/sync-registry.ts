import fs from 'node:fs';
import path from 'node:path';
import { parseRegistryWorkbook } from '../src/lib/registry/parseRegistryFile';
import { normalizeCaseNumber } from '../src/lib/registryNumbers';
import { upsertRowsToSnapshot, loadCasesSnapshot } from '../src/lib/registry/caseSnapshot';

async function syncDirect(filePath: string) {
  console.log(`[Sync] Reading file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`ไม่พบไฟล์ที่ระบุ: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const parsed = parseRegistryWorkbook(buffer, fileName);

  if (!parsed.success || parsed.rows.length === 0) {
    throw new Error(parsed.error || 'ไม่พบข้อมูลคดีในไฟล์นี้');
  }

  console.log(`[Sync] พบ ${parsed.totalRows} รายการ (ประเภท: ${parsed.caseType})`);

  // 1. Always update local snapshot in machine/repo first
  const snapshotResult = upsertRowsToSnapshot(parsed.rows, parsed.caseType);
  console.log(`[Sync Snapshot] บันทึกลง snapshot ในเครื่องสำเร็จ: ปรับปรุง ${snapshotResult.updatedCount} คดี, เพิ่มใหม่ ${snapshotResult.insertedCount} คดี`);

  // 2. Try calling local Next.js API if server is running
  try {
    const fileBase64 = buffer.toString('base64');
    const apiRes = await fetch('http://127.0.0.1:3000/api/registry/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileBase64, fileName }),
      signal: AbortSignal.timeout(4000),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      console.log(`[Sync via HTTP API] สำเร็จ: ${data.summary || data.message}`);
      return data;
    }
  } catch (netErr: any) {
    console.log(`[Sync] เว็บเซิร์ฟเวอร์ไม่ได้เปิดอยู่ (${netErr.message}) -> ดำเนินการอัปเดตลงฐานข้อมูล/สแน็ปช็อต`);
  }

  // 3. Fallback: Direct Prisma DB Upsert if database connection is available
  let dbUpdated = snapshotResult.updatedCount;
  let dbInserted = snapshotResult.insertedCount;

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy') && !process.env.DATABASE_URL.includes('[SENSITIVE]')) {
    try {
      const { default: prisma } = await import('../src/lib/db');
      const blackNumbersToCheck = Array.from(new Set(parsed.rows.map(r => r.blackNumber).filter(Boolean)));
      const existingCases = await prisma.case.findMany({
        where: {
          type: parsed.caseType,
          blackNumber: { in: blackNumbersToCheck },
        },
        select: {
          id: true,
          type: true,
          blackNumber: true,
          redNumber: true,
          currentStatus: true,
          receivedDate: true,
          meetingDate: true,
          dueDate30: true,
          dueDate60: true,
          dueDate90: true,
          dueDate120: true,
          dueDate240: true,
        },
      });

      const existingMap = new Map<string, typeof existingCases[number]>();
      existingCases.forEach(c => {
        existingMap.set(normalizeCaseNumber(c.blackNumber), c);
      });

      let insertedCount = 0;
      let updatedCount = 0;

      const CHUNK_SIZE = 25;
      for (let i = 0; i < parsed.rows.length; i += CHUNK_SIZE) {
        const chunk = parsed.rows.slice(i, i + CHUNK_SIZE);

        await prisma.$transaction(async (tx) => {
          for (const row of chunk) {
            const existing = existingMap.get(normalizeCaseNumber(row.blackNumber));

            const caseData: Record<string, any> = {
              type: row.type,
              blackNumber: row.blackNumber,
              redNumber: row.redNumber,
              registryRedText: row.registryRedText,
              petitionerName: row.petitionerName,
              respondentName: row.respondentName,
              subject: row.subject,
              legalCategory: row.legalCategory,
              legalOfficerName: row.legalOfficerName,
              committeeOwnerName: row.committeeOwnerName,
              proceedingNote: row.proceedingNote,
              receivedDate: row.receivedDate ?? existing?.receivedDate ?? null,
              dueDate30: row.dueDate30 ?? existing?.dueDate30 ?? null,
              dueDate60: row.dueDate60 ?? existing?.dueDate60 ?? null,
              dueDate90: row.dueDate90 ?? existing?.dueDate90 ?? null,
              dueDate120: row.dueDate120 ?? existing?.dueDate120 ?? null,
              dueDate240: row.dueDate240 ?? existing?.dueDate240 ?? null,
              meetingDate: row.meetingDate ?? existing?.meetingDate ?? null,
              currentStatus: row.currentStatus,
              decisionResult: row.decisionResult,
              oneDriveUrl: row.oneDriveUrl,
            };

            let caseId = existing?.id;
            if (existing) {
              await tx.case.update({
                where: { id: existing.id },
                data: caseData,
              });
              updatedCount++;
            } else {
              const newCase = await tx.case.create({
                data: caseData as any,
              });
              caseId = newCase.id;
              existingMap.set(normalizeCaseNumber(row.blackNumber), newCase as any);
              insertedCount++;
            }

            if (caseId) {
              await tx.caseEvent.create({
                data: {
                  caseId,
                  action: existing ? 'sync_latest_registry_update' : 'import_case',
                  actorName: 'Desktop DropZone Tool',
                },
              });
            }
          }
        }, { timeout: 30000, maxWait: 10000 });
      }

      dbUpdated = updatedCount;
      dbInserted = insertedCount;
      console.log(`[Sync DB Direct] อัปเดตฐานข้อมูลสำเร็จ: ปรับปรุง ${updatedCount} คดี, เพิ่มใหม่ ${insertedCount} คดี`);
    } catch (dbErr: any) {
      console.warn(`[Sync DB] ข้ามการเชื่อมต่อ Prisma DB: ${dbErr.message}`);
    }
  }

  const result = {
    success: true,
    fileName,
    caseType: parsed.caseType,
    totalRows: parsed.totalRows,
    updatedCount: dbUpdated,
    insertedCount: dbInserted,
    summary: `อัปเดตทะเบียนคุม${parsed.caseType}สำเร็จ: ปรับปรุง ${dbUpdated} คดี, เพิ่มใหม่ ${dbInserted} คดี (รวม ${parsed.totalRows} คดี)`,
  };

  console.log(`[Sync Complete] ${result.summary}`);
  return result;
}

// Execution
const targetFile = process.argv[2];
if (!targetFile) {
  console.log('Usage: npx tsx scripts/sync-registry.ts "<path-to-excel-file>"');
  process.exit(1);
}

syncDirect(path.resolve(targetFile))
  .then((res) => {
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('SYNC_ERROR:', err.message);
    process.exit(1);
  });
