import { getHydratedSnapshotCases } from './caseSnapshot';
import { normalizeCaseNumber } from '../registryNumbers';

// In-memory cache for fast snapshot lookups
let snapshotMapCache: Map<string, any> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30_000;

export function getCachedSnapshotMap(): Map<string, any> {
  const now = Date.now();
  if (snapshotMapCache && now - lastCacheTime < CACHE_TTL_MS) {
    return snapshotMapCache;
  }
  const snapCases = getHydratedSnapshotCases();
  const map = new Map<string, any>();
  for (const c of snapCases) {
    if (c.blackNumber) {
      map.set(normalizeCaseNumber(c.blackNumber), c);
    }
  }
  snapshotMapCache = map;
  lastCacheTime = now;
  return map;
}

/**
 * Hydrates a case object in-place with the latest snapshot data.
 * If proceedingNote or other key fields are missing or empty in DB,
 * fills them from the offline snapshot.
 */
export function hydrateCaseWithSnapshot<T extends Record<string, any>>(record: T): T {
  if (!record || !record.blackNumber) return record;
  const map = getCachedSnapshotMap();
  const snap = map.get(normalizeCaseNumber(record.blackNumber));
  if (!snap) return record;

  const target = record as any;
  if ((!target.proceedingNote || String(target.proceedingNote).trim() === '') && snap.proceedingNote) {
    target.proceedingNote = snap.proceedingNote;
  }
  if ((!target.registryRedText || String(target.registryRedText).trim() === '') && snap.registryRedText) {
    target.registryRedText = snap.registryRedText;
  }
  if ((!target.decisionResult || String(target.decisionResult).trim() === '') && snap.decisionResult) {
    target.decisionResult = snap.decisionResult;
  }
  if ((!target.oneDriveUrl || String(target.oneDriveUrl).trim() === '') && snap.oneDriveUrl) {
    target.oneDriveUrl = snap.oneDriveUrl;
  }
  return record;
}

/**
 * Hydrates a list of cases in-place with the latest snapshot data.
 */
export function hydrateCasesWithSnapshot<T extends Record<string, any>>(records: T[]): T[] {
  if (!Array.isArray(records) || records.length === 0) return records;
  for (const r of records) {
    hydrateCaseWithSnapshot(r);
  }
  return records;
}

let isSyncing = false;
let lastSyncAttempt = 0;
const SYNC_COOLDOWN_MS = 60_000; // 1 minute cooldown between background syncs

/**
 * Synchronizes cases from cases-snapshot.json directly into the database.
 * Updates proceedingNote, registryRedText, decisionResult, etc. for existing records.
 */
export async function syncSnapshotToDatabase(prisma: any): Promise<{
  success: boolean;
  totalSnapshot: number;
  updatedCount: number;
  insertedCount: number;
  message: string;
}> {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl || dbUrl.includes('dummy') || dbUrl.includes('[SENSITIVE]')) {
    return {
      success: false,
      totalSnapshot: 0,
      updatedCount: 0,
      insertedCount: 0,
      message: 'DATABASE_URL is not configured or is a placeholder.',
    };
  }

  const snapCases = getHydratedSnapshotCases();
  if (!snapCases || snapCases.length === 0) {
    return {
      success: true,
      totalSnapshot: 0,
      updatedCount: 0,
      insertedCount: 0,
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
        proceedingNote: true,
        currentStatus: true,
        decisionResult: true,
        oneDriveUrl: true,
      },
    });

    const existingMap = new Map<string, typeof existing[number]>();
    for (const c of existing) {
      if (c.blackNumber) {
        existingMap.set(normalizeCaseNumber(c.blackNumber), c);
      }
    }

    let updatedCount = 0;
    let insertedCount = 0;

    // 2. Identify cases needing updates or insertion
    const updatesToRun: Array<{ id: string; data: Record<string, any> }> = [];
    const insertsToRun: Array<Record<string, any>> = [];

    for (const snap of snapCases) {
      const match = existingMap.get(normalizeCaseNumber(snap.blackNumber));
      if (match) {
        // Check if DB is missing proceedingNote or other fields that snapshot has
        const needsNoteUpdate = snap.proceedingNote && (!match.proceedingNote || match.proceedingNote.trim() !== snap.proceedingNote.trim());
        const needsRedUpdate = snap.registryRedText && (!match.registryRedText || match.registryRedText.trim() !== snap.registryRedText.trim());
        const needsDecisionUpdate = snap.decisionResult && (!match.decisionResult || match.decisionResult.trim() !== snap.decisionResult.trim());
        const needsUrlUpdate = snap.oneDriveUrl && (!match.oneDriveUrl || match.oneDriveUrl.trim() !== snap.oneDriveUrl.trim());

        if (needsNoteUpdate || needsRedUpdate || needsDecisionUpdate || needsUrlUpdate) {
          const updateData: Record<string, any> = {};
          if (needsNoteUpdate) updateData.proceedingNote = snap.proceedingNote;
          if (needsRedUpdate) updateData.registryRedText = snap.registryRedText;
          if (needsDecisionUpdate) updateData.decisionResult = snap.decisionResult;
          if (needsUrlUpdate) updateData.oneDriveUrl = snap.oneDriveUrl;
          if (snap.currentStatus && snap.currentStatus !== match.currentStatus) updateData.currentStatus = snap.currentStatus;

          updatesToRun.push({ id: match.id, data: updateData });
        }
      } else {
        insertsToRun.push({
          type: snap.type,
          blackNumber: snap.blackNumber,
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

    // 3. Execute updates in chunks of 25
    const CHUNK_SIZE = 25;
    for (let i = 0; i < updatesToRun.length; i += CHUNK_SIZE) {
      const chunk = updatesToRun.slice(i, i + CHUNK_SIZE);
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
    }

    // 4. Execute inserts in chunks of 25
    for (let i = 0; i < insertsToRun.length; i += CHUNK_SIZE) {
      const chunk = insertsToRun.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction(
        chunk.map((data) =>
          prisma.case.create({
            data,
          })
        ),
        { timeout: 30000, maxWait: 10000 }
      );
      insertedCount += chunk.length;
    }

    const message = `Auto-synced snapshot to DB: ${updatedCount} cases updated, ${insertedCount} cases created.`;
    console.log(`[DBSync] ${message}`);
    return {
      success: true,
      totalSnapshot: snapCases.length,
      updatedCount,
      insertedCount,
      message,
    };
  } catch (error: any) {
    console.error('[DBSync] Error syncing snapshot to database:', error);
    return {
      success: false,
      totalSnapshot: snapCases.length,
      updatedCount: 0,
      insertedCount: 0,
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

  // Run in background without blocking response
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
