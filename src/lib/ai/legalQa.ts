import prisma from "@/lib/db";
import { searchChunks, SearchMode, RetrievalResultItem, SearchFilters } from "@/lib/rag/retrieval/searchChunks";
import { auditLog } from "@/lib/audit";
import { createAiHarness, getAiHarnessStatus, pseudonymizeText } from '../../../shared/ai-harness.mjs';
import {
  assertChunkRevisionUnchanged,
  assertDraftRevisionUnchanged,
  captureChunkRevisionSnapshot,
  captureDraftRevisionSnapshot,
  DraftRevisionExpectation,
  DraftRevisionSnapshot,
} from "./revisionGuard";

export interface GenerateQaOptions extends DraftRevisionExpectation {
  query: string;
  mode?: SearchMode;
  filters?: SearchFilters;
  userId?: string;
  topK?: number;
  caseId?: string;
  draftId?: string;
  sectionId?: string;
}

export interface QaResponse {
  answer: string;
  citations: RetrievalResultItem[];
  modelUsed: string;
  revision?: DraftRevisionSnapshot | null;
}

export interface LegalQaDeps {
  db?: any;
  searchChunksFn?: typeof searchChunks;
  harness?: ReturnType<typeof createAiHarness>;
  auditLogFn?: (...args: Parameters<typeof auditLog>) => Promise<unknown>;
}

export async function generateLegalAnswer(
  options: GenerateQaOptions,
  deps: LegalQaDeps = {},
): Promise<QaResponse> {
  const {
    query,
    mode = "hybrid",
    filters,
    userId,
    topK = 5,
    caseId,
    draftId,
    sectionId,
    expectedCaseUpdatedAt,
    expectedDraftUpdatedAt,
    expectedSectionUpdatedAt,
    expectedSectionContent,
  } = options;
  const db = deps.db ?? prisma;
  const searchChunksFn = deps.searchChunksFn ?? searchChunks;
  const harness = deps.harness ?? createAiHarness();
  const auditLogFn = deps.auditLogFn ?? auditLog;

  let draftRevisionSnapshot: DraftRevisionSnapshot | null = null;
  let sensitiveValues: Array<{ kind: 'PERSON' | 'CASE' | 'ID'; value: string }> = [];

  if (caseId) {
    const captured = await captureDraftRevisionSnapshot(
      {
        caseId,
        draftId,
        sectionId,
        expected: {
          expectedCaseUpdatedAt,
          expectedDraftUpdatedAt,
          expectedSectionUpdatedAt,
          expectedSectionContent,
        },
      },
      db,
    );
    draftRevisionSnapshot = captured.snapshot;
    sensitiveValues = [
      { kind: 'PERSON', value: captured.caseData.petitionerName || '' },
      { kind: 'PERSON', value: captured.caseData.respondentName || '' },
      { kind: 'PERSON', value: captured.caseData.legalOfficerName || '' },
      { kind: 'PERSON', value: captured.caseData.committeeOwnerName || '' },
      { kind: 'CASE', value: captured.caseData.blackNumber || '' },
      { kind: 'CASE', value: captured.caseData.redNumber || '' },
    ];
  }

  // 1. Create RetrievalQuery explicitly to capture its ID (store redacted query text)
  const redactedQueryText = pseudonymizeText(query, sensitiveValues).text;
  const retrievalQuery = await db.retrievalQuery.create({
    data: {
      queryText: redactedQueryText,
      userId: userId || null,
    }
  });

  // 2. Search chunks
  const searchResults = await searchChunksFn({
    query,
    mode,
    filters,
    userId,
    topK,
    queryId: retrievalQuery.id, // pass the explicitly created queryId
  });

  const configuredModel = harness.status?.model || getAiHarnessStatus().model;

  // If no chunks found, fallback
  if (searchResults.length === 0) {
    if (draftRevisionSnapshot) {
      await assertDraftRevisionUnchanged(draftRevisionSnapshot, db);
    }
    const fallbackAnswer = "ไม่พบข้อมูลที่เพียงพอในฐานข้อมูลที่ได้รับอนุมัติ";
    await saveAnswerToDb(db, retrievalQuery.id, fallbackAnswer, configuredModel, []);
    await logAudit(auditLogFn, userId, retrievalQuery.id);
    return {
      answer: fallbackAnswer,
      citations: [],
      modelUsed: configuredModel,
      revision: draftRevisionSnapshot,
    };
  }

  const chunkIds = searchResults.map(result => result.chunkId);
  const chunkSnapshot = await captureChunkRevisionSnapshot(chunkIds, db);

  // 3. Format context
  const contextText = searchResults.map((chunk) => {
    return `[Source ID: ${chunk.chunkId}]
หัวข้อ: ${chunk.sourceTitle}
ประเภท: ${chunk.sourceType}
อ้างอิง: ${chunk.citationMetadata?.referenceNumber || "ไม่มี"}
ข้อมูล: ${chunk.content}`;
  }).join("\n\n");

  // 4. Construct system prompt
  const systemPrompt = `คุณคือผู้ช่วย AI ด้านกฎหมายสำหรับ ก.พ.ค.ตร. (ระบบพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ)
หน้าที่ของคุณคือการตอบคำถามทางกฎหมายโดยอ้างอิงจากข้อมูลที่ให้ไว้ใน "บริบท (Context)" ด้านล่างนี้เท่านั้น

กฎการตอบ (Rules):
1. หากข้อมูลในบริบทไม่เพียงพอต่อการตอบคำถาม ห้ามแต่งเติมข้อมูลเด็ดขาด ให้ตอบเพียงว่า "ไม่พบข้อมูลที่เพียงพอในฐานข้อมูลที่ได้รับอนุมัติ"
2. ห้ามใช้ความรู้ทั่วไปนอกเหนือจากบริบทที่กำหนดให้
3. รูปแบบการตอบต้องเป็นภาษาทางการ กฎหมาย (Thai legal/government style)
4. แยกหัวข้อในการตอบดังนี้:
   - ข้อกฎหมาย (หลักกฎหมายที่เกี่ยวข้อง)
   - แนวคำวินิจฉัย/แนวคำพิพากษา (ถ้ามีในบริบท)
   - ข้อสังเกต (สรุปหรือข้อควรระวัง)
5. ทุกประเด็นสำคัญต้องอ้าง Source ID ที่ให้ไว้ในรูป [source_id] และส่งรหัสที่ใช้จริงใน citations ห้ามอ้างรหัสขึ้นมาเอง
6. ห้ามสร้าง มาตรา วันที่ หมายเลขคดี หรือชื่อบุคคล ที่ไม่มีในบริบท
7. ห้ามร่างคำวินิจฉัยฉบับเต็ม และไม่ใช่การทดแทนการตรวจสอบโดยนักกฎหมาย

บริบท (Context):
${contextText}

ส่งผลลัพธ์เป็น JSON ที่มี answer และ citations เท่านั้น`;

  // 5. Call Model
  const aiResult = await harness.generateStructured<{answer: string; citations: string[]}>({
    instructions: systemPrompt,
    input: query,
    schemaName: 'legal_qa',
    schema: {
      type: 'object',
      properties: {answer: {type: 'string'}, citations: {type: 'array', items: {type: 'string'}}},
      required: ['answer', 'citations'],
      additionalProperties: false,
    },
    approvedSourceIds: chunkIds,
    sensitiveValues,
    userId,
  });

  // 5b. Re-verify revision after AI completes; abort with 409 if case/draft/section or retrieved chunks changed
  if (draftRevisionSnapshot) {
    await assertDraftRevisionUnchanged(draftRevisionSnapshot, db);
  }
  await assertChunkRevisionUnchanged(chunkSnapshot, db);

  const generatedAnswer = aiResult.data.answer || "ไม่พบข้อมูลที่เพียงพอในฐานข้อมูลที่ได้รับอนุมัติ";
  const citedIds = aiResult.data.citations;
  const citedResults = searchResults.filter(result => citedIds.includes(result.chunkId));

  // 6. Save Answer
  await saveAnswerToDb(db, retrievalQuery.id, generatedAnswer, aiResult.meta.model, citedIds);
  
  // 7. Log audit
  await logAudit(auditLogFn, userId, retrievalQuery.id, aiResult.meta);

  return {
    answer: generatedAnswer,
    citations: citedResults,
    modelUsed: aiResult.meta.model,
    revision: draftRevisionSnapshot,
  };
}

async function saveAnswerToDb(db: any, queryId: string, answerText: string, modelUsed: string, chunkIds: string[]) {
  const answer = await db.legalAnswer.create({
    data: {
      queryId,
      answerText,
      modelUsed,
    }
  });

  if (chunkIds.length > 0) {
    await db.legalAnswerCitation.createMany({
      data: chunkIds.map(chunkId => ({
        answerId: answer.id,
        chunkId,
      }))
    });
  }
}

async function logAudit(
  auditLogFn: (...args: Parameters<typeof auditLog>) => Promise<unknown>,
  userId: string | undefined,
  queryId: string,
  meta?: {provider: string; model: string; usage: unknown; inputHash: string; redactedCount: number},
) {
  if (userId) {
    await auditLogFn({
      userId,
      action: "LEGAL_QA_GENERATED",
      entityType: "RetrievalQuery",
      entityId: queryId,
      afterValue: meta ? JSON.stringify(meta) : undefined,
    });
  }
}

