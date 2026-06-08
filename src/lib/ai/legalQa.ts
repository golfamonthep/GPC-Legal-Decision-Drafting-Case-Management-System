import OpenAI from "openai";
import prisma from "@/lib/db";
import { searchChunks, SearchMode, RetrievalResultItem, SearchFilters } from "@/lib/rag/retrieval/searchChunks";
import { auditLog } from "@/lib/audit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

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

  const modelName = "gpt-4o-mini";

  // If no chunks found, fallback
  if (searchResults.length === 0) {
    const fallbackAnswer = "ไม่พบข้อมูลที่เพียงพอในฐานข้อมูลที่ได้รับอนุมัติ";
    await saveAnswerToDb(retrievalQuery.id, fallbackAnswer, modelName, []);
    await logAudit(userId, retrievalQuery.id);
    return {
      answer: fallbackAnswer,
      citations: [],
      modelUsed: modelName
    };
  }

  // 3. Format context
  const contextText = searchResults.map((chunk, index) => {
    return `[เอกสารอ้างอิงที่ ${index + 1}]
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
5. ทุกประเด็นสำคัญที่อ้างอิง ต้องระบุแหล่งที่มา (เช่น "[เอกสารอ้างอิงที่ 1]") ท้ายประโยคเสมอ ห้ามอ้างอิงขึ้นมาเอง
6. ห้ามสร้าง มาตรา วันที่ หมายเลขคดี หรือชื่อบุคคล ที่ไม่มีในบริบท
7. ห้ามร่างคำวินิจฉัยฉบับเต็ม และไม่ใช่การทดแทนการตรวจสอบโดยนักกฎหมาย

บริบท (Context):
${contextText}`;

  // 5. Call Model
  let generatedAnswer = "";
  try {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0,
    });
    generatedAnswer = completion.choices[0].message.content || "ไม่พบข้อมูลที่เพียงพอในฐานข้อมูลที่ได้รับอนุมัติ";
  } catch (error) {
    console.error("OpenAI Error:", error);
    generatedAnswer = "เกิดข้อผิดพลาดในการประมวลผลคำตอบ กรุณาลองใหม่อีกครั้ง";
  }

  // 6. Save Answer
  await saveAnswerToDb(retrievalQuery.id, generatedAnswer, modelName, searchResults.map(r => r.chunkId));
  
  // 7. Log audit
  await logAudit(userId, retrievalQuery.id);

  return {
    answer: generatedAnswer,
    citations: searchResults,
    modelUsed: modelName
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

async function logAudit(userId: string | undefined, queryId: string) {
  if (userId) {
    await auditLog({
      userId,
      action: "LEGAL_QA_GENERATED",
      entityType: "RetrievalQuery",
      entityId: queryId,
    });
  }
}
