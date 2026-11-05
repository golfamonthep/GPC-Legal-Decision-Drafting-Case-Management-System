import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireApiPermission } from '@/lib/auth/requireApiPermission';
import prisma from '@/lib/db';
import { parseRegistryWorkbook, ParsedRegistryCaseRow } from '@/lib/registry/parseRegistryFile';
import { normalizeCaseNumber } from '@/lib/registryNumbers';
import { upsertRowsToSnapshot } from '@/lib/registry/caseSnapshot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiPermission('IMPORT_REGISTRY');
    const auditUserId = user.id.startsWith('mvp-') ? null : user.id;

    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let fileName = 'registry.xlsx';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, code: 'NO_FILE', message: 'กรุณาแนบไฟล์ Excel (.xlsx, .xlsm) หรือ .csv' },
          { status: 400 },
        );
      }
      fileName = file.name;
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body.fileBase64) {
        buffer = Buffer.from(body.fileBase64, 'base64');
        fileName = body.fileName || 'registry.xlsx';
      } else {
        return NextResponse.json(
          { success: false, code: 'INVALID_PAYLOAD', message: 'ไม่พบไฟล์ที่ต้องการอัปเดต' },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { success: false, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'รองรับเฉพาะ multipart/form-data หรือ JSON base64' },
        { status: 415 },
      );
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { success: false, code: 'EMPTY_FILE', message: 'ไฟล์ที่ส่งมาว่างเปล่า' },
        { status: 400 },
      );
    }

    // 1. Parse Workbook
    const parsed = parseRegistryWorkbook(buffer, fileName);
    if (!parsed.success || parsed.rows.length === 0) {
      return NextResponse.json(
        { success: false, code: 'PARSE_ERROR', message: parsed.error || 'ไม่พบข้อมูลคดีที่สามารถนำเข้าได้ในไฟล์นี้' },
        { status: 400 },
      );
    }

    const snapshotResult = upsertRowsToSnapshot(parsed.rows, parsed.caseType);
    let insertedCount = snapshotResult.insertedCount;
    let updatedCount = snapshotResult.updatedCount;
    let skippedCount = 0;
    const failedRows: any[] = [];
    const messages: string[] = [];

    // 2. Direct Prisma DB Upsert if database connection is configured
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy') && !process.env.DATABASE_URL.includes('[SENSITIVE]')) {
      try {
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

        let dbInserted = 0;
        let dbUpdated = 0;

        // 3. Process in chunks
        const CHUNK_SIZE = 25;
        for (let i = 0; i < parsed.rows.length; i += CHUNK_SIZE) {
          const chunk = parsed.rows.slice(i, i + CHUNK_SIZE);

          try {
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
                  dbUpdated++;
                } else {
                  const newCase = await tx.case.create({
                    data: caseData as any,
                  });
                  caseId = newCase.id;
                  existingMap.set(normalizeCaseNumber(row.blackNumber), newCase as any);
                  dbInserted++;
                }

                if (caseId) {
                  await tx.caseEvent.create({
                    data: {
                      caseId,
                      action: existing ? 'sync_latest_registry_update' : 'import_case',
                      actorName: user.name || 'DropZone Quick Sync',
                    },
                  });

                  await tx.auditLog.create({
                    data: {
                      userId: auditUserId,
                      action: existing ? 'sync_registry_update' : 'import_registry',
                      entityType: 'Case',
                      entityId: caseId,
                      afterValue: JSON.stringify(row.raw),
                    },
                  });
                }
              }
            }, { timeout: 30000, maxWait: 10000 });
          } catch (err: any) {
            console.error('Error during chunk sync:', err);
            chunk.forEach(r => {
              failedRows.push(r);
              messages.push(`แถวที่ ${r.index} (${r.blackNumber}): ไม่สามารถอัปเดตได้ (${err.message})`);
            });
          }
        }

        insertedCount = dbInserted;
        updatedCount = dbUpdated;
      } catch (dbErr: any) {
        console.warn('Database upsert skipped or failed, using snapshot result:', dbErr.message);
      }
    }

    // 4. Revalidate pages for instant UI update
    try {
      revalidatePath('/cases');
      revalidatePath('/dashboard');
      revalidatePath('/registry');
    } catch (e) {
      // ignore in non-request contexts
    }

    const summaryMsg = `อัปเดตทะเบียนคุม${parsed.caseType}สำเร็จ: ปรับปรุง ${updatedCount} คดี, เพิ่มใหม่ ${insertedCount} คดี (รวม ${parsed.totalRows} คดี)`;

    return NextResponse.json({
      success: true,
      fileName,
      caseType: parsed.caseType,
      totalRows: parsed.totalRows,
      updatedCount,
      insertedCount,
      skippedCount,
      failedCount: failedRows.length,
      messages: messages.slice(0, 10),
      summary: summaryMsg,
    });
  } catch (error: any) {
    console.error('Registry sync error:', error);
    if (error?.message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, code: 'PERMISSION_ERROR', message: 'คุณไม่มีสิทธิ์ดำเนินการนี้' }, { status: 403 });
    }
    if (error?.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, code: 'PERMISSION_ERROR', message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: error?.message || 'เกิดข้อผิดพลาดในการประมวลผล' }, { status: 500 });
  }
}
