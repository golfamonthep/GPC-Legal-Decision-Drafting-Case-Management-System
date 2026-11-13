import { getHydratedSnapshotCases, loadCasesSnapshot } from './caseSnapshot';
import { normalizeCaseNumber } from '../registryNumbers';

// In-memory cache for fast snapshot lookups
let snapshotMapCache: Map<string, any> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10_000;

function makeCompositeKey(type: string | undefined | null, blackNumber: string): string {
  const normBlack = normalizeCaseNumber(blackNumber);
  return type ? `${type.trim()}::${normBlack}` : normBlack;
}

export function invalidateSnapshotCache(): void {
  snapshotMapCache = null;
  lastCacheTime = 0;
}

export function getCachedSnapshotMap(): Map<string, any> {
  const now = Date.now();
  if (snapshotMapCache && now - lastCacheTime < CACHE_TTL_MS) {
    return snapshotMapCache;
  }
  const snapCases = getHydratedSnapshotCases();
  const map = new Map<string, any>();
  for (const c of snapCases) {
    if (c.blackNumber) {
      const normBlack = normalizeCaseNumber(c.blackNumber);
      map.set(makeCompositeKey(c.type, c.blackNumber), c);
      if (!map.has(normBlack)) {
        map.set(normBlack, c);
      }
    }
  }
  snapshotMapCache = map;
  lastCacheTime = now;
  return map;
}

/**
 * Hydrates a case object in-place with the latest snapshot data.
 * Uses composite key (type + blackNumber) and overwrites stale fields when snapshot is newer
 * or when DB fields are empty.
 */
export function hydrateCaseWithSnapshot<T extends Record<string, any>>(record: T): T {
  if (!record || !record.blackNumber) return record;
  const map = getCachedSnapshotMap();
  const snap =
    (record.type ? map.get(makeCompositeKey(record.type, record.blackNumber)) : undefined) ??
    map.get(normalizeCaseNumber(record.blackNumber));
  if (!snap) return record;

  const target = record as any;
  const dbUpdatedMs = target.updatedAt ? new Date(target.updatedAt).getTime() : 0;
  const snapUpdatedMs = snap.updatedAt ? new Date(snap.updatedAt).getTime() : 0;
  const snapIsNewer = !dbUpdatedMs || snapUpdatedMs >= dbUpdatedMs;

  if (snap.proceedingNote && (!target.proceedingNote || String(target.proceedingNote).trim() === '' || snapIsNewer)) {
    target.proceedingNote = snap.proceedingNote;
  }
  if (snap.registryRedText && (!target.registryRedText || String(target.registryRedText).trim() === '' || snapIsNewer)) {
    target.registryRedText = snap.registryRedText;
  }
  if (snap.redNumber && (!target.redNumber || String(target.redNumber).trim() === '' || snapIsNewer)) {
    target.redNumber = snap.redNumber;
  }
  if (snap.currentStatus && (!target.currentStatus || String(target.currentStatus).trim() === '' || snapIsNewer)) {
    target.currentStatus = snap.currentStatus;
  }
  if (snap.decisionResult && (!target.decisionResult || String(target.decisionResult).trim() === '' || snapIsNewer)) {
    target.decisionResult = snap.decisionResult;
  }
  if (snap.oneDriveUrl && (!target.oneDriveUrl || String(target.oneDriveUrl).trim() === '' || snapIsNewer)) {
    target.oneDriveUrl = snap.oneDriveUrl;
  }
  if (snap.legalOfficerName && (!target.legalOfficerName || String(target.legalOfficerName).trim() === '' || snapIsNewer)) {
    target.legalOfficerName = snap.legalOfficerName;
  }
  return record;
}

/**
 * Hydrates a list of cases in-place with the latest snapshot data.
 * Optionally appends new cases present in the snapshot that are not yet in the DB query result.
 */
export function hydrateCasesWithSnapshot<T extends Record<string, any>>(
  records: T[],
  options?: { appendMissingFromSnapshot?: boolean; typeFilter?: string }
): T[] {
  if (!Array.isArray(records)) return records;
  for (const r of records) {
    hydrateCaseWithSnapshot(r);
  }

  if (options?.appendMissingFromSnapshot) {
    const seen = new Set<string>();
    for (const r of records) {
      if (r?.blackNumber) {
        seen.add(makeCompositeKey(r.type, r.blackNumber));
      }
    }
    const snapCases = getHydratedSnapshotCases();
    for (const snap of snapCases) {
      if (options.typeFilter && options.typeFilter !== 'all' && snap.type !== options.typeFilter) {
        continue;
      }
      const key = makeCompositeKey(snap.type, snap.blackNumber);
      if (!seen.has(key)) {
        seen.add(key);
        records.push(snap as T);
      }
    }
  }

  return records;
}

let isSyncing = false;
let lastSyncAttempt = 0;
const SYNC_COOLDOWN_MS = 30_000; // 30 seconds cooldown between background syncs

/**
 * Synchronizes cases from cases-snapshot.json (or provided customCases payload)
 * directly into the PostgreSQL database.
 */
export async function syncSnapshotToDatabase(
  prisma: any,
  customCases?: any[]
): Promise<{
  success: boolean;
  totalSnapshot: number;
  updatedCount: number;
  insertedCount: number;
  syncedAt: string;
  message: string;
}> {
  const syncedAt = new Date().toISOString();
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl || dbUrl.includes('dummy') || dbUrl.includes('[SENSITIVE]') || !prisma) {
    return {
      success: false,
      totalSnapshot: 0,
      updatedCount: 0,
      insertedCount: 0,
      syncedAt,
      message: 'DATABASE_URL is not configured or is a placeholder.',
    };
  }

  const snapCases = Array.isArray(customCases) && customCases.length > 0
    ? customCases
    : getHydratedSnapshotCases();

  if (!snapCases || snapCases.length === 0) {
    return {
      success: true,
      totalSnapshot: 0,
      updatedCount: 0,
      insertedCount: 0,
      syncedAt,
      message: 'No snapshot cases found to sync.',
    };
  }

  try {
    // 1. Fetch existing cases from DB
    const existing = await prisma.case.findMany({
      select: {
        id: true,
        type: true,
        blackNumber: true,
        redNumber: true,
        registryRedText: true,
        petitionerName: true,
        respondentName: true,
        subject: true,
        legalOfficerName: true,
        committeeOwnerName: true,
        proceedingNote: true,
        currentStatus: true,
        decisionResult: true,
        oneDriveUrl: true,
      },
    });

    const existingMap = new Map<string, typeof existing[number]>();
    for (const c of existing) {
      if (c.blackNumber) {
        existingMap.set(makeCompositeKey(c.type, c.blackNumber), c);
      }
    }

    let updatedCount = 0;
    let insertedCount = 0;

    // 2. Identify cases needing updates or insertion
    const updatesToRun: Array<{ id: string; data: Record<string, any> }> = [];
    const insertsToRun: Array<Record<string, any>> = [];

    for (const snap of snapCases) {
      if (!snap.blackNumber) continue;
      const key = makeCompositeKey(snap.type, snap.blackNumber);
      const match = existingMap.get(key);

      if (match) {
        const needsNoteUpdate =
          snap.proceedingNote !== undefined &&
          (match.proceedingNote || '').trim() !== String(snap.proceedingNote || '').trim();
        const needsRedTextUpdate =
          snap.registryRedText !== undefined &&
          (match.registryRedText || '').trim() !== String(snap.registryRedText || '').trim();
        const needsRedNoUpdate =
          snap.redNumber !== undefined &&
          (match.redNumber || '') !== String(snap.redNumber || '');
        const needsStatusUpdate =
          snap.currentStatus &&
          (match.currentStatus || '').trim() !== String(snap.currentStatus).trim();
        const needsDecisionUpdate =
          snap.decisionResult !== undefined &&
          (match.decisionResult || '').trim() !== String(snap.decisionResult || '').trim();
        const needsUrlUpdate =
          snap.oneDriveUrl !== undefined &&
          (match.oneDriveUrl || '').trim() !== String(snap.oneDriveUrl || '').trim();
        const needsOfficerUpdate =
          snap.legalOfficerName !== undefined &&
          (match.legalOfficerName || '').trim() !== String(snap.legalOfficerName || '').trim();
        const needsPetitionerUpdate =
          snap.petitionerName &&
          (match.petitionerName || '').trim() !== String(snap.petitionerName).trim();
        const needsSubjectUpdate =
          snap.subject &&
          (match.subject || '').trim() !== String(snap.subject).trim();

        if (
          needsNoteUpdate ||
          needsRedTextUpdate ||
          needsRedNoUpdate ||
          needsStatusUpdate ||
          needsDecisionUpdate ||
          needsUrlUpdate ||
          needsOfficerUpdate ||
          needsPetitionerUpdate ||
          needsSubjectUpdate
        ) {
          const updateData: Record<string, any> = {};
          if (needsNoteUpdate) updateData.proceedingNote = snap.proceedingNote || null;
          if (needsRedTextUpdate) updateData.registryRedText = snap.registryRedText || null;
          if (needsRedNoUpdate) updateData.redNumber = snap.redNumber || null;
          if (needsStatusUpdate) updateData.currentStatus = snap.currentStatus;
          if (needsDecisionUpdate) updateData.decisionResult = snap.decisionResult || null;
          if (needsUrlUpdate) updateData.oneDriveUrl = snap.oneDriveUrl || null;
          if (needsOfficerUpdate) updateData.legalOfficerName = snap.legalOfficerName || null;
          if (needsPetitionerUpdate) updateData.petitionerName = snap.petitionerName;
          if (needsSubjectUpdate) updateData.subject = snap.subject;

          updatesToRun.push({ id: match.id, data: updateData });
        }
      } else {
        insertsToRun.push({
          type: snap.type,
          blackNumber: normalizeCaseNumber(snap.blackNumber),
          redNumber: snap.redNumber || null,
          registryRedText: snap.registryRedText || null,
          petitionerName: snap.petitionerName || 'ไม่ระบุ',
          respondentName: snap.respondentName || 'ไม่ระบุ',
          subject: snap.subject || 'ไม่ระบุ',
          legalCategory: snap.legalCategory || (snap.type === 'อุทธรณ์' ? 'อุทธรณ์คำสั่ง' : 'ร้องทุกข์'),
          legalOfficerName: snap.legalOfficerName || null,
          committeeOwnerName: snap.committeeOwnerName || null,
          proceedingNote: snap.proceedingNote || null,
          receivedDate: snap.receivedDate ? new Date(snap.receivedDate) : null,
          dueDate30: snap.dueDate30 ? new Date(snap.dueDate30) : null,
          dueDate60: snap.dueDate60 ? new Date(snap.dueDate60) : null,
          dueDate90: snap.dueDate90 ? new Date(snap.dueDate90) : null,
          dueDate120: snap.dueDate120 ? new Date(snap.dueDate120) : null,
          dueDate240: snap.dueDate240 ? new Date(snap.dueDate240) : null,
          meetingDate: snap.meetingDate ? new Date(snap.meetingDate) : null,
          currentStatus: snap.currentStatus || 'อยู่ระหว่างดำเนินการ',
          decisionResult: snap.decisionResult || null,
          oneDriveUrl: snap.oneDriveUrl || null,
        });
      }
    }

    // 3. Execute updates in chunks of 25, with per-row fallback on constraint conflict
    const CHUNK_SIZE = 25;
    for (let i = 0; i < updatesToRun.length; i += CHUNK_SIZE) {
      const chunk = updatesToRun.slice(i, i + CHUNK_SIZE);
      try {
        await prisma.$transaction(
          chunk.map((item) =>
            prisma.case.update({
              where: { id: item.id },
              data: item.data,
            })
          ),
          { timeout: 30000, maxWait: 10000 }
        );
        updatedCount += chunk.length;
      } catch {
        for (const item of chunk) {
          try {
            await prisma.case.update({
              where: { id: item.id },
              data: item.data,
            });
            updatedCount++;
          } catch (rowErr: any) {
            // Retry without redNumber if unique redNumber constraint collided
            if (item.data.redNumber !== undefined) {
              try {
                const { redNumber: _omit, ...restData } = item.data;
                await prisma.case.update({
                  where: { id: item.id },
                  data: restData,
                });
                updatedCount++;
              } catch {}
            }
          }
        }
      }
    }

    // 4. Execute inserts in chunks of 25, with per-row fallback
    for (let i = 0; i < insertsToRun.length; i += CHUNK_SIZE) {
      const chunk = insertsToRun.slice(i, i + CHUNK_SIZE);
      try {
        await prisma.$transaction(
          chunk.map((data) =>
            prisma.case.create({
              data,
            })
          ),
          { timeout: 30000, maxWait: 10000 }
        );
        insertedCount += chunk.length;
      } catch {
        for (const data of chunk) {
          try {
            await prisma.case.create({ data });
            insertedCount++;
          } catch {
            try {
              await prisma.case.create({ data: { ...data, redNumber: null } });
              insertedCount++;
            } catch {}
          }
        }
      }
    }

    invalidateSnapshotCache();
    const message = `ซิงค์ฐานข้อมูลสำเร็จ: อัปเดต ${updatedCount} คดี, เพิ่มใหม่ ${insertedCount} คดี (รวมทั้งหมด ${snapCases.length} คดี)`;
    console.log(`[DBSync] ${message}`);
    return {
      success: true,
      totalSnapshot: snapCases.length,
      updatedCount,
      insertedCount,
      syncedAt,
      message,
    };
  } catch (error: any) {
    console.error('[DBSync] Error syncing snapshot to database:', error);
    return {
      success: false,
      totalSnapshot: snapCases.length,
      updatedCount: 0,
      insertedCount: 0,
      syncedAt,
      message: `Database sync failed: ${error.message}`,
    };
  }
}

/**
 * Non-blocking background scheduler to trigger DB sync if cooldown elapsed.
 */
export function scheduleBackgroundDbSync(prisma: any): void {
  if (isSyncing) return;
  const now = Date.now();
  if (now - lastSyncAttempt < SYNC_COOLDOWN_MS) return;
  lastSyncAttempt = now;
  isSyncing = true;

  Promise.resolve().then(async () => {
    try {
      await syncSnapshotToDatabase(prisma);
    } catch (err: any) {
      console.warn('[DBSync] Background sync failed:', err?.message);
    } finally {
      isSyncing = false;
    }
  });
}

export function getSnapshotMetadata() {
  const snap = loadCasesSnapshot();
  return {
    updatedAt: snap.updatedAt,
    summary: snap.summary,
    recentChanges: snap.recentChanges || [],
  };
}
