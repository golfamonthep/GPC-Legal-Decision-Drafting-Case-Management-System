import { PrismaClient } from '@/generated/prisma';
import prisma from '@/lib/db';
import OpenAI from 'openai';
import { searchChunks } from '@/lib/rag/retrieval/searchChunks';
import { auditLog } from '@/lib/audit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

const AI_MODEL = process.env.AI_DRAFT_MODEL || "gpt-4o-mini";

export type ReviewMode = 'language_only' | 'legal_style' | 'consistency' | 'risk_check' | 'full_section_review';

export interface LegalWordingReviewParams {
  caseId: string;
  draftId?: string;
  sectionId?: string;
  sectionType: string;
  currentSectionText: string;
  reviewMode: ReviewMode;
  userId?: string;
}

export interface ReviewIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  originalText: string;
  explanationThai: string;
  suggestedText: string;
  sourceChunkIds?: string[];
}

export interface LegalWordingReviewResponse {
  overallAssessment: string;
  riskLevel: 'low' | 'medium' | 'high';
  canSuggestRewrite: boolean;
  issues: ReviewIssue[];
  improvedSectionText: string;
  citationNotes: string;
  humanReviewWarning: string;
  sourcesUsed: any[];
}

export async function reviewLegalWording(params: LegalWordingReviewParams): Promise<LegalWordingReviewResponse> {
  const { caseId, draftId, sectionId, sectionType, currentSectionText, reviewMode, userId } = params;

  if (!currentSectionText || currentSectionText.trim() === '') {
    throw new Error('Section text is empty. Cannot perform review.');
  }

  // 1. Load case metadata
  const caseData = await prisma.case.findUnique({
    where: { id: caseId }
  });

  if (!caseData) {
    throw new Error(`Case not found: ${caseId}`);
  }

  // 2. Retrieval using searchChunks if applicable (legal_style, consistency, risk_check, full_section_review)
  let searchResults: any[] = [];
  let contextChunks = "";
  let chunkIds: string[] = [];

  if (reviewMode !== 'language_only') {
    const searchQuery = `${sectionType} ${caseData.type} ${currentSectionText.substring(0, 500)}`;
    try {
      searchResults = await searchChunks({
        query: searchQuery,
        mode: 'hybrid',
        userId,
        filters: {
          legalCategory: caseData.legalCategory,
          sourceStatus: 'ใช้งาน',
          reliabilityLevels: ['official', 'internal']
        },
        topK: 5
      });

      if (searchResults && searchResults.length > 0) {
        contextChunks = searchResults.map(r => `Source ID: ${r.chunkId}\nSource: ${r.sourceTitle}\nCitation: ${r.citationMetadata?.referenceNumber || 'N/A'}\nContent:\n${r.content}`).join('\n\n---\n\n');
        chunkIds = searchResults.map(r => r.chunkId);
      }
    } catch (e) {
      console.warn('Retrieval failed during wording review:', e);
      // We allow fallback to language_only logic if retrieval fails but text exists.
    }
  }

  const hasSources = searchResults.length > 0;

  // 3. Construct system and user prompts
  const systemPrompt = `You are reviewing Thai legal/government wording for ก.พ.ค.ตร. (คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ).

CRITICAL RULES:
1. You are NOT deciding the case. You are NOT changing facts. You are NOT changing the legal outcome.
2. You MUST preserve names, ranks, dates, case numbers, order numbers, and legal references unless the user explicitly edits them or they contain obvious typos.
3. You must not change "ฟังขึ้น" to "ฟังไม่ขึ้น" or vice-versa. Do not change the conclusion.
4. If a sentence is legally risky because it overstates facts or evidence, explain why and suggest a safer wording.
5. All suggestions are drafts for human legal review.
6. Do not invent facts, laws, cases, dates, ranks, names, or decision results.
7. Do not use general model knowledge for legal authority. If no source supports a legal wording, say that source support is insufficient.
8. Output MUST be valid JSON matching the exact schema requested. Do not wrap JSON in markdown block backticks.

Review Mode constraints:
- language_only: ตรวจภาษา สำนวน ความชัดเจน ความกระชับ ภาษาราชการ
- legal_style: ตรวจถ้อยคำทางกฎหมาย ความเป็นกลาง ความสอดคล้องกับรูปแบบคำวินิจฉัย (use sources if available)
- consistency: ตรวจความสอดคล้องของคำเรียกคู่กรณี เช่น ผู้ร้องทุกข์/ผู้อุทธรณ์/คู่กรณี
- risk_check: ตรวจถ้อยคำที่อาจเกินข้อเท็จจริง เกินพยานหลักฐาน หรือสรุปผลเกินฐานข้อมูล
- full_section_review: ตรวจครบทุกด้านของ section นั้นเท่านั้น ไม่ใช่ทั้งเอกสาร

Section Type: ${sectionType}
Review Mode: ${reviewMode}

Output JSON format:
{
  "overallAssessment": "string (Thai)",
  "riskLevel": "low" | "medium" | "high",
  "canSuggestRewrite": boolean,
  "issues": [
    {
      "type": "string (e.g. คำผิด, ความกำกวม, ถ้อยคำที่เกินข้อเท็จจริง, ความไม่สอดคล้อง)",
      "severity": "low" | "medium" | "high",
      "originalText": "string",
      "explanationThai": "string",
      "suggestedText": "string",
      "sourceChunkIds": ["string"] // only if you used a retrieved source
    }
  ],
  "improvedSectionText": "string (The fully improved section text incorporating suggestions, keeping same overall structure)",
  "citationNotes": "string (Thai) (Notes on citations used, or warning if insufficient sources)",
  "humanReviewWarning": "ข้อเสนอจาก AI เป็นเพียงร่างเพื่อช่วยตรวจถ้อยคำ ต้องตรวจสอบโดยนิติกร/กรรมการก่อนนำไปใช้จริง และไม่ถือเป็นผลคำวินิจฉัยของ ก.พ.ค.ตร."
}`;

  const userPrompt = `Case Details:
- Case Number (Black): ${caseData.blackNumber}
- Petitioner: ${caseData.petitionerName}
- Respondent: ${caseData.respondentName}
- Subject: ${caseData.subject}
- Case Type: ${caseData.type}

Current Section Text to Review:
${currentSectionText}

${hasSources ? `Retrieved Context (USE ONLY THESE SOURCES for legal citations):\n${contextChunks}` : "No retrieved context available. Rely only on language and style rules."}

Please review the text in mode "${reviewMode}" and output ONLY valid JSON.`;

  // 4. Call LLM
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const generatedContent = response.choices[0].message.content || "{}";
  let parsedResult: any;

  try {
    parsedResult = JSON.parse(generatedContent);
  } catch (e) {
    throw new Error('Failed to parse AI review result as JSON.');
  }

  // Enforce the required warning message and insufficient source warning
  parsedResult.humanReviewWarning = "ข้อเสนอจาก AI เป็นเพียงร่างเพื่อช่วยตรวจถ้อยคำ ต้องตรวจสอบโดยนิติกร/กรรมการก่อนนำไปใช้จริง และไม่ถือเป็นผลคำวินิจฉัยของ ก.พ.ค.ตร.";
  if (!hasSources && reviewMode !== 'language_only') {
    parsedResult.citationNotes = "ระบบไม่พบแหล่งอ้างอิงที่เพียงพอสำหรับตรวจถ้อยคำเชิงกฎหมาย จึงแสดงได้เฉพาะข้อเสนอด้านภาษาเท่านั้น\n" + (parsedResult.citationNotes || "");
  }

  // 5. Store the AI operation in AiQueryLog
  const aiQuery = await prisma.aiQueryLog.create({
    data: {
      userId,
      prompt: userPrompt,
      response: generatedContent,
      modelUsed: AI_MODEL,
    }
  });

  // 6. Log the audit event (using AuditLog)
  if (userId) {
    await auditLog({
      userId,
      action: "AI_LEGAL_WORDING_REVIEW_COMPLETED",
      entityType: "DecisionDraftSection",
      entityId: sectionId || "unknown",
      afterValue: JSON.stringify({ 
        model: AI_MODEL, 
        reviewMode, 
        riskLevel: parsedResult.riskLevel,
        chunkIds,
        aiQueryId: aiQuery.id
      })
    });
  }

  return {
    overallAssessment: parsedResult.overallAssessment || "",
    riskLevel: parsedResult.riskLevel || "low",
    canSuggestRewrite: parsedResult.canSuggestRewrite ?? true,
    issues: parsedResult.issues || [],
    improvedSectionText: parsedResult.improvedSectionText || currentSectionText,
    citationNotes: parsedResult.citationNotes || "",
    humanReviewWarning: parsedResult.humanReviewWarning,
    sourcesUsed: searchResults
  };
}
