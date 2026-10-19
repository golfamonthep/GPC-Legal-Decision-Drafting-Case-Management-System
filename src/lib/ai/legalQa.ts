import prisma from "@/lib/db";
import { searchChunks, SearchMode, RetrievalResultItem, SearchFilters } from "@/lib/rag/retrieval/searchChunks";
import { auditLog } from "@/lib/audit";
import { createAiHarness, getAiHarnessStatus } from '../../../shared/ai-harness.mjs';

export interface GenerateQaOptions {
  query: string;
  mode?: SearchMode;
  filters?: SearchFilters;
  userId?: string;
  topK?: number;
}

export interface QaResponse {
  answer: string;
  citations: RetrievalResultItem[];
  modelUsed: string;
}

export async function generateLegalAnswer(options: GenerateQaOptions): Promise<QaResponse> {
  const { query, mode = "hybrid", filters, userId, topK = 5 } = options;

  // 1. Create RetrievalQuery explicitly to capture its ID
  const retrievalQuery = await prisma.retrievalQuery.create({
    data: {
      queryText: query,
      userId: userId || null,
    }
  });

  // 2. Search chunks
  const searchResults = await searchChunks({
    query,
    mode,
    filters,
    userId,
    topK,
    queryId: retrievalQuery.id, // pass the explicitly created queryId
  });

  const configuredModel = getAiHarnessStatus().model;

  // If no chunks found, fallback
  if (searchResults.length === 0) {
    const fallbackAnswer = "ไม่พบข้อมูลที่เพียงพอในฐานข้อมูลที่ได้รับอนุมัติ";
    await saveAnswerToDb(retrievalQuery.id, fallbackAnswer, configuredModel, []);
    await logAudit(userId, retrievalQuery.id);
    return {
      answer: fallbackAnswer,
      citations: [],
      modelUsed: configuredModel
    };
  }

  // 3. Format context
  const contextText = searchResults.map((chunk, index) => {
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
  const aiResult = await createAiHarness().generateStructured<{answer: string; citations: string[]}>({
    instructions: systemPrompt,
    input: query,
    schemaName: 'legal_qa',
    schema: {
      type: 'object',
      properties: {answer: {type: 'string'}, citations: {type: 'array', items: {type: 'string'}}},
      required: ['answer', 'citations'],
      additionalProperties: false,
    },
    approvedSourceIds: searchResults.map(result => result.chunkId),
    userId,
  });
  const generatedAnswer = aiResult.data.answer || "ไม่พบข้อมูลที่เพียงพอในฐานข้อมูลที่ได้รับอนุมัติ";
  const citedIds = aiResult.data.citations;
  const citedResults = searchResults.filter(result => citedIds.includes(result.chunkId));

  // 6. Save Answer
  await saveAnswerToDb(retrievalQuery.id, generatedAnswer, aiResult.meta.model, citedIds);
  
  // 7. Log audit
  await logAudit(userId, retrievalQuery.id, aiResult.meta);

  return {
    answer: generatedAnswer,
    citations: citedResults,
    modelUsed: aiResult.meta.model
  };
}

async function saveAnswerToDb(queryId: string, answerText: string, modelUsed: string, chunkIds: string[]) {
  const answer = await prisma.legalAnswer.create({
    data: {
      queryId,
      answerText,
      modelUsed,
    }
  });

  if (chunkIds.length > 0) {
    await prisma.legalAnswerCitation.createMany({
      data: chunkIds.map(chunkId => ({
        answerId: answer.id,
        chunkId,
      }))
    });
  }
}

async function logAudit(userId: string | undefined, queryId: string, meta?: {provider: string; model: string; usage: unknown; inputHash: string; redactedCount: number}) {
  if (userId) {
    await auditLog({
      userId,
      action: "LEGAL_QA_GENERATED",
      entityType: "RetrievalQuery",
      entityId: queryId,
      afterValue: meta ? JSON.stringify(meta) : undefined,
    });
  }
}
