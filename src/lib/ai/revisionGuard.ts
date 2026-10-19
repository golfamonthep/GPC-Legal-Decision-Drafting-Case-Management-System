import { AiHarnessError } from '../../../shared/ai-harness.mjs';

async function resolveDb(db?: any) {
  if (db) return db;
  const mod = await import('@/lib/db');
  return mod.default;
}

export class StaleRevisionError extends Error {
  status = 409;
  code = 'STALE_REVISION';

  constructor(
    message = 'ข้อมูลหรือร่างถูกแก้ไขระหว่างประมวลผล กรุณาโหลดข้อมูลล่าสุดแล้วลองใหม่เพื่อไม่ให้ทับร่างมนุษย์',
  ) {
    super(message);
    this.name = 'StaleRevisionError';
  }
}

export interface DraftRevisionExpectation {
  expectedCaseUpdatedAt?: string | Date | null;
  expectedDraftUpdatedAt?: string | Date | null;
  expectedSectionUpdatedAt?: string | Date | null;
  expectedSectionContent?: string | null;
}

export interface DraftRevisionSnapshot {
  caseId: string;
  caseUpdatedAt: string | null;
  draftId: string | null;
  draftUpdatedAt: string | null;
  sectionId: string | null;
  sectionUpdatedAt: string | null;
  sectionContent: string | null;
}

export interface ChunkRevisionSnapshotItem {
  id: string;
  updatedAt: string | null;
  sourceStatus: string | null;
  content: string | null;
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function assertSameTimestamp(
  expected: string | Date | null | undefined,
  actual: Date | string | null | undefined,
  message: string,
) {
  if (expected === undefined || expected === null || expected === '') return;
  const expectedIso = toIsoOrNull(expected);
  const actualIso = toIsoOrNull(actual);
  if (!expectedIso || !actualIso || expectedIso !== actualIso) {
    throw new StaleRevisionError(message);
  }
}

function notFoundError(message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status: 404 });
}

export async function captureDraftRevisionSnapshot(
  params: {
    caseId: string;
    draftId?: string | null;
    sectionId?: string | null;
    expected?: DraftRevisionExpectation;
  },
  dbParam?: any,
): Promise<{
  caseData: any;
  draft: any | null;
  section: any | null;
  snapshot: DraftRevisionSnapshot;
}> {
  const db = await resolveDb(dbParam);
  const { caseId, draftId, sectionId, expected } = params;

  const caseData = await db.case.findUnique({
    where: { id: caseId },
  });

  if (!caseData) {
    throw notFoundError(`Case not found: ${caseId}`);
  }

  let section: any | null = null;
  let draft: any | null = null;

  if (sectionId && typeof db.decisionDraftSection?.findUnique === 'function') {
    section = await db.decisionDraftSection.findUnique({
      where: { id: sectionId },
      include: { draft: true },
    });
    if (!section) {
      throw notFoundError(`Draft section not found: ${sectionId}`);
    }
    if (draftId && section.draftId !== draftId) {
      throw notFoundError(`Draft section ${sectionId} does not belong to draft ${draftId}`);
    }
    if (section.draft && section.draft.caseId !== caseId) {
      throw notFoundError(`Draft section ${sectionId} does not belong to case ${caseId}`);
    }
    draft = section.draft ?? null;
  } else if (draftId && typeof db.decisionDraft?.findUnique === 'function') {
    draft = await db.decisionDraft.findUnique({
      where: { id: draftId },
    });
    if (!draft || draft.caseId !== caseId) {
      throw notFoundError(`Draft not found in case: ${draftId}`);
    }
  }

  assertSameTimestamp(
    expected?.expectedCaseUpdatedAt,
    caseData.updatedAt,
    'ข้อมูลสำนวนถูกแก้ไขไปแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนใช้ AI',
  );

  if (draft) {
    assertSameTimestamp(
      expected?.expectedDraftUpdatedAt,
      draft.updatedAt,
      'ร่างคำวินิจฉัยถูกแก้ไขไปแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนใช้ AI',
    );
  } else if (expected?.expectedDraftUpdatedAt) {
    throw new StaleRevisionError('ไม่พบสถานะร่างคำวินิจฉัยที่ตรงกับรุ่นที่ระบุ');
  }

  if (section) {
    assertSameTimestamp(
      expected?.expectedSectionUpdatedAt,
      section.updatedAt,
      'ร่างส่วนนี้ถูกแก้ไขไปแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนใช้ AI เพื่อไม่ให้ทับร่างมนุษย์',
    );
    if (
      expected?.expectedSectionContent !== undefined &&
      expected?.expectedSectionContent !== null &&
      section.content !== expected.expectedSectionContent
    ) {
      throw new StaleRevisionError(
        'เนื้อหาร่างส่วนนี้เปลี่ยนไปจากข้อมูลล่าสุดในระบบ กรุณาบันทึกหรือโหลดข้อมูลใหม่ก่อนใช้ AI',
      );
    }
  } else if (expected?.expectedSectionUpdatedAt || expected?.expectedSectionContent !== undefined) {
    throw new StaleRevisionError('ไม่พบสถานะส่วนร่างคำวินิจฉัยที่ตรงกับรุ่นที่ระบุ');
  }

  const snapshot: DraftRevisionSnapshot = {
    caseId: caseData.id,
    caseUpdatedAt: toIsoOrNull(caseData.updatedAt),
    draftId: draft?.id ?? draftId ?? null,
    draftUpdatedAt: toIsoOrNull(draft?.updatedAt),
    sectionId: section?.id ?? sectionId ?? null,
    sectionUpdatedAt: toIsoOrNull(section?.updatedAt),
    sectionContent: typeof section?.content === 'string' ? section.content : null,
  };

  return { caseData, draft, section, snapshot };
}

export async function assertDraftRevisionUnchanged(
  snapshot: DraftRevisionSnapshot,
  dbParam?: any,
): Promise<void> {
  const db = await resolveDb(dbParam);
  const currentCase = await db.case.findUnique({
    where: { id: snapshot.caseId },
  });

  if (!currentCase) {
    throw new StaleRevisionError('ไม่พบสำนวนเดิมหลังจากประมวลผล AI ระบบยกเลิกผลลัพธ์');
  }

  if (snapshot.caseUpdatedAt && toIsoOrNull(currentCase.updatedAt) !== snapshot.caseUpdatedAt) {
    throw new StaleRevisionError(
      'ข้อมูลสำนวนเปลี่ยนระหว่างประมวลผล AI ระบบยกเลิกผลลัพธ์เพื่อป้องกันการทับข้อมูลใหม่',
    );
  }

  if (snapshot.sectionId && typeof db.decisionDraftSection?.findUnique === 'function') {
    const currentSection = await db.decisionDraftSection.findUnique({
      where: { id: snapshot.sectionId },
      include: { draft: true },
    });
    if (
      !currentSection ||
      (snapshot.draftId && currentSection.draftId !== snapshot.draftId) ||
      (currentSection.draft && currentSection.draft.caseId !== snapshot.caseId)
    ) {
      throw new StaleRevisionError(
        'ส่วนร่างคำวินิจฉัยเปลี่ยนสถานะระหว่างประมวลผล AI ระบบยกเลิกผลลัพธ์เพื่อไม่ให้ทับร่างมนุษย์',
      );
    }
    if (
      (snapshot.sectionUpdatedAt &&
        toIsoOrNull(currentSection.updatedAt) !== snapshot.sectionUpdatedAt) ||
      (snapshot.sectionContent !== null && currentSection.content !== snapshot.sectionContent) ||
      (snapshot.draftUpdatedAt &&
        toIsoOrNull(currentSection.draft?.updatedAt) !== snapshot.draftUpdatedAt)
    ) {
      throw new StaleRevisionError(
        'ร่างคำวินิจฉัยถูกแก้ไขระหว่างประมวลผล AI ระบบยกเลิกผลลัพธ์เพื่อไม่ให้ทับร่างมนุษย์',
      );
    }
  } else if (snapshot.draftId && typeof db.decisionDraft?.findUnique === 'function') {
    const currentDraft = await db.decisionDraft.findUnique({
      where: { id: snapshot.draftId },
    });
    if (
      !currentDraft ||
      currentDraft.caseId !== snapshot.caseId ||
      (snapshot.draftUpdatedAt && toIsoOrNull(currentDraft.updatedAt) !== snapshot.draftUpdatedAt)
    ) {
      throw new StaleRevisionError(
        'ร่างคำวินิจฉัยถูกแก้ไขระหว่างประมวลผล AI ระบบยกเลิกผลลัพธ์เพื่อไม่ให้ทับร่างมนุษย์',
      );
    }
  }
}

export async function captureChunkRevisionSnapshot(
  chunkIds: string[],
  dbParam?: any,
): Promise<Map<string, ChunkRevisionSnapshotItem> | null> {
  const db = await resolveDb(dbParam);
  if (!chunkIds.length || typeof db.documentChunk?.findMany !== 'function') {
    return null;
  }
  const rows = await db.documentChunk.findMany({
    where: { id: { in: chunkIds } },
    select: { id: true, updatedAt: true, sourceStatus: true, content: true },
  });
  const map = new Map<string, ChunkRevisionSnapshotItem>();
  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      updatedAt: toIsoOrNull(row.updatedAt),
      sourceStatus: row.sourceStatus ?? null,
      content: typeof row.content === 'string' ? row.content : null,
    });
  }
  return map;
}

export async function assertChunkRevisionUnchanged(
  snapshot: Map<string, ChunkRevisionSnapshotItem> | null,
  dbParam?: any,
): Promise<void> {
  const db = await resolveDb(dbParam);
  if (!snapshot || snapshot.size === 0 || typeof db.documentChunk?.findMany !== 'function') {
    return;
  }
  const ids = Array.from(snapshot.keys());
  const rows = await db.documentChunk.findMany({
    where: { id: { in: ids } },
    select: { id: true, updatedAt: true, sourceStatus: true, content: true },
  });
  if (rows.length !== snapshot.size) {
    throw new StaleRevisionError(
      'แหล่งอ้างอิงบางรายการถูกลบหรือเปลี่ยนสถานะระหว่างประมวลผล AI กรุณาลองใหม่อีกครั้ง',
    );
  }
  for (const row of rows) {
    const prev = snapshot.get(row.id);
    if (!prev) {
      throw new StaleRevisionError('แหล่งอ้างอิงเปลี่ยนระหว่างประมวลผล AI กรุณาลองใหม่อีกครั้ง');
    }
    if (row.sourceStatus && row.sourceStatus !== 'ใช้งาน') {
      throw new StaleRevisionError(
        'แหล่งอ้างอิงถูกปรับสถานะเป็นไม่ใช้งานระหว่างประมวลผล AI กรุณาลองใหม่อีกครั้ง',
      );
    }
    if (
      (prev.updatedAt && toIsoOrNull(row.updatedAt) !== prev.updatedAt) ||
      (prev.content !== null && row.content !== prev.content)
    ) {
      throw new StaleRevisionError(
        'เนื้อหาแหล่งอ้างอิงถูกแก้ไขระหว่างประมวลผล AI กรุณาลองใหม่อีกครั้ง',
      );
    }
  }
}

export function toAiRouteError(
  error: unknown,
  fallbackMessage: string,
): { status: number; body: { error: string; code?: string } } {
  const err = error as Error & { status?: number; code?: string };
  const message = err?.message || '';

  if (message === 'UNAUTHORIZED') {
    return { status: 401, body: { error: 'กรุณาเข้าสู่ระบบ', code: 'UNAUTHORIZED' } };
  }
  if (message === 'FORBIDDEN') {
    return { status: 403, body: { error: 'คุณไม่มีสิทธิ์ดำเนินการนี้', code: 'FORBIDDEN' } };
  }
  if (err instanceof StaleRevisionError || err?.status === 409 || err?.code === 'STALE_REVISION') {
    return {
      status: 409,
      body: {
        error:
          message ||
          'ข้อมูลหรือร่างถูกแก้ไขระหว่างประมวลผล กรุณาโหลดข้อมูลล่าสุดแล้วลองใหม่เพื่อไม่ให้ทับร่างมนุษย์',
        code: 'STALE_REVISION',
      },
    };
  }
  if (err instanceof AiHarnessError) {
    return {
      status: err.status || 503,
      body: { error: err.message, code: err.code },
    };
  }
  if (message.includes('Section text is empty')) {
    return {
      status: 400,
      body: { error: 'ข้อความว่างเปล่า ไม่สามารถตรวจสอบได้', code: 'EMPTY_SECTION' },
    };
  }
  if (message.includes('No relevant legal sources found')) {
    return {
      status: 404,
      body: { error: message, code: 'NO_APPROVED_SOURCES' },
    };
  }
  if (
    err?.status === 404 ||
    message.startsWith('Case not found:') ||
    message.startsWith('Draft section not found:') ||
    message.startsWith('Draft not found')
  ) {
    return {
      status: 404,
      body: { error: 'ไม่พบข้อมูลสำนวนหรือส่วนร่างคำวินิจฉัยที่ระบุ', code: 'NOT_FOUND' },
    };
  }
  if (err?.status && err.status >= 400 && err.status < 600) {
    return {
      status: err.status,
      body: { error: message || fallbackMessage, ...(err.code ? { code: err.code } : {}) },
    };
  }
  return { status: 500, body: { error: fallbackMessage } };
}
