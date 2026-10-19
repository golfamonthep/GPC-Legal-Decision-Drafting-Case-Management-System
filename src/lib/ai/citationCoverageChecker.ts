import prisma from '@/lib/db';
import { searchChunks } from '@/lib/rag/retrieval/searchChunks';
import { auditLog } from '@/lib/audit';
import { createAiHarness } from '../../../shared/ai-harness.mjs';

export type CoverageMode = 'facts' | 'legal_basis' | 'reasoning' | 'precedent' | 'full_section_coverage';

export interface CitationCoverageCheckerParams {
  caseId: string;
  draftId?: string;
  sectionId?: string;
  sectionType: string;
  currentSectionText: string;
  coverageMode: CoverageMode;
  userId?: string;
}

export interface CheckedClaim {
  claimText: string;
  claimType: 'fact' | 'law' | 'reasoning' | 'conclusion' | 'procedural' | 'citation';
  supportStatus: 'supported' | 'partially_supported' | 'unsupported' | 'not_checked';
  supportingSourceChunkIds?: string[];
  explanationThai: string;
  recommendedActionThai: string;
}

export interface MissingSupport {
  statement: string;
  whySupportIsNeededThai: string;
  suggestedSourceTypeThai: string;
}

export interface CitationCoverageCheckerResponse {
  overallCoverage: 'sufficient' | 'partial' | 'insufficient' | 'not_applicable';
  coverageScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  sectionType: string;
  checkedClaims: CheckedClaim[];
  missingSupport: MissingSupport[];
  sourceSummary: string;
  humanReviewWarning: string;
  retrievedChunksUsed: any[];
}

export async function checkCitationCoverage(params: CitationCoverageCheckerParams): Promise<CitationCoverageCheckerResponse> {
  const { caseId, draftId, sectionId, sectionType, currentSectionText, coverageMode, userId } = params;

  if (!currentSectionText || currentSectionText.trim() === '') {
    throw new Error('Section text is empty. Cannot perform citation coverage check.');
  }

  // 1. Load case metadata
  const caseData = await prisma.case.findUnique({
    where: { id: caseId }
  });

  if (!caseData) {
    throw new Error(`Case not found: ${caseId}`);
  }

  // 2. Retrieval using searchChunks
  let searchResults: any[] = [];
  let contextChunks = "";
  let chunkIds: string[] = [];

  const searchQuery = `${sectionType} ${caseData.type} ${currentSectionText.substring(0, 500)}`;
  try {
    searchResults = await searchChunks({
      query: searchQuery,
      mode: 'hybrid',
      userId,
      filters: {
        legalCategory: caseData.legalCategory,
        sourceStatus: 'ใช้งาน',
      },
      topK: 6
    });

    if (searchResults && searchResults.length > 0) {
      contextChunks = searchResults.map(r => `Source ID: ${r.chunkId}\nSource: ${r.sourceTitle}\nCitation: ${r.citationMetadata?.referenceNumber || 'N/A'}\nContent:\n${r.content}`).join('\n\n---\n\n');
      chunkIds = searchResults.map(r => r.chunkId);
    }
  } catch (e) {
    console.warn('Retrieval failed during citation coverage check:', e);
    // Mark as insufficient later if it fails and there's no chunk
  }

  const hasSources = searchResults.length > 0;

  // 3. Construct system and user prompts
  const systemPrompt = `You are a Citation Coverage Checker for the ก.พ.ค.ตร. (คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ).
Your job is to review a decision draft section and determine whether important statements are sufficiently supported by retrieved sources.

CRITICAL RULES:
1. You MUST NOT add facts, add law, or change the result.
2. You MUST NOT rewrite the decision or decide whether the petitioner/appellant wins.
3. You MUST NOT invent facts, laws, cases, dates, ranks, names, order numbers, or decision results.
4. You MUST NOT treat your internal model memory as a legal source. Only rely on the provided Retrieved Context.
5. If retrieved sources do not support a claim, you MUST mark it as 'unsupported' or 'partially_supported' and say so.
6. The output MUST be a structured JSON following the exact schema.

Coverage Mode Definitions:
- facts: ตรวจว่าข้อเท็จจริงสำคัญมีแหล่งรองรับหรือไม่
- legal_basis: ตรวจว่าข้อกฎหมาย/มาตรา/ระเบียบ/คำสั่ง มีแหล่งรองรับหรือไม่
- reasoning: ตรวจว่าเหตุผลวินิจฉัยเชื่อมโยงกับข้อเท็จจริงและข้อกฎหมายเพียงพอหรือไม่
- precedent: ตรวจว่าถ้อยคำหรือแนววินิจฉัยมีคำวินิจฉัยเดิม/แนวทางเดิมรองรับหรือไม่
- full_section_coverage: ตรวจครบทั้ง section นั้นเท่านั้น ไม่ใช่ทั้งเอกสาร

Coverage Interpretation:
- sufficient: most important claims have direct support.
- partial: some claims have support but important claims are missing support.
- insufficient: key claims have no support or sources do not match the statements.
- not_applicable: section is administrative/empty/placeholder and does not require citation yet.

Risk Level Logic:
- low: mostly supported; minor missing sources only.
- medium: several important claims partially supported or missing.
- high: key legal/factual claims unsupported, source mismatch, or conclusion appears unsupported.

Required JSON Output Format:
{
  "overallCoverage": "sufficient" | "partial" | "insufficient" | "not_applicable",
  "coverageScore": <number 0-100>,
  "riskLevel": "low" | "medium" | "high",
  "sectionType": "string",
  "checkedClaims": [
    {
      "claimText": "string",
      "claimType": "fact" | "law" | "reasoning" | "conclusion" | "procedural" | "citation",
      "supportStatus": "supported" | "partially_supported" | "unsupported" | "not_checked",
      "supportingSourceChunkIds": ["uuid"], // Map back to provided Source IDs. Use empty array if none.
      "explanationThai": "string",
      "recommendedActionThai": "string"
    }
  ],
  "missingSupport": [
    {
      "statement": "string",
      "whySupportIsNeededThai": "string",
      "suggestedSourceTypeThai": "string"
    }
  ],
  "sourceSummary": "string (Summary of how the sources were used or lack thereof)",
  "humanReviewWarning": "ผลการตรวจแหล่งอ้างอิงเป็นเครื่องมือช่วยตรวจสอบเบื้องต้น ต้องตรวจสอบโดยนิติกร/กรรมการก่อนใช้ประกอบคำวินิจฉัยจริง"
}`;

  const userPrompt = `Case Details:
- Case Number (Black): ${caseData.blackNumber}
- Case Type: ${caseData.type}

Current Section Text to Check:
${currentSectionText}

${hasSources ? `Retrieved Context:\n${contextChunks}` : "No retrieved context available. All specific facts/laws in the text should be considered unsupported."}

Please check the citation coverage in mode "${coverageMode}" and output ONLY valid JSON matching the format. If no retrieved context is available, overallCoverage must be 'insufficient' unless the section is completely administrative/empty ('not_applicable').`;

  // 4. Call LLM
  const aiResult = await createAiHarness().generateStructured<Omit<CitationCoverageCheckerResponse, 'retrievedChunksUsed'>>({
    instructions: systemPrompt,
    input: userPrompt,
    schemaName: 'citation_coverage',
    schema: {
      type: 'object',
      properties: {
        overallCoverage: {type: 'string', enum: ['sufficient', 'partial', 'insufficient', 'not_applicable']},
        coverageScore: {type: 'number'},
        riskLevel: {type: 'string', enum: ['low', 'medium', 'high']},
        sectionType: {type: 'string'},
        checkedClaims: {type: 'array', items: {type: 'object', properties: {
          claimText: {type: 'string'}, claimType: {type: 'string', enum: ['fact', 'law', 'reasoning', 'conclusion', 'procedural', 'citation']}, supportStatus: {type: 'string', enum: ['supported', 'partially_supported', 'unsupported', 'not_checked']}, supportingSourceChunkIds: {type: 'array', items: {type: 'string'}}, explanationThai: {type: 'string'}, recommendedActionThai: {type: 'string'},
        }, required: ['claimText', 'claimType', 'supportStatus', 'supportingSourceChunkIds', 'explanationThai', 'recommendedActionThai'], additionalProperties: false}},
        missingSupport: {type: 'array', items: {type: 'object', properties: {statement: {type: 'string'}, whySupportIsNeededThai: {type: 'string'}, suggestedSourceTypeThai: {type: 'string'}}, required: ['statement', 'whySupportIsNeededThai', 'suggestedSourceTypeThai'], additionalProperties: false}},
        sourceSummary: {type: 'string'},
        humanReviewWarning: {type: 'string'},
      },
      required: ['overallCoverage', 'coverageScore', 'riskLevel', 'sectionType', 'checkedClaims', 'missingSupport', 'sourceSummary', 'humanReviewWarning'],
      additionalProperties: false,
    },
    approvedSourceIds: chunkIds,
    sensitiveValues: [
      {kind: 'PERSON', value: caseData.petitionerName || ''},
      {kind: 'PERSON', value: caseData.respondentName || ''},
      {kind: 'CASE', value: caseData.blackNumber || ''},
      {kind: 'CASE', value: caseData.redNumber || ''},
    ],
    userId,
  });
  const parsedResult = aiResult.data;
  const generatedContent = JSON.stringify(parsedResult);

  // Enforce required warning
  parsedResult.humanReviewWarning = "ผลการตรวจแหล่งอ้างอิงเป็นเครื่องมือช่วยตรวจสอบเบื้องต้น ต้องตรวจสอบโดยนิติกร/กรรมการก่อนใช้ประกอบคำวินิจฉัยจริง";
  
  if (!hasSources && parsedResult.overallCoverage !== 'not_applicable') {
    parsedResult.overallCoverage = 'insufficient';
    parsedResult.sourceSummary = "ระบบไม่พบแหล่งอ้างอิงที่เพียงพอสำหรับข้อความสำคัญบางส่วน กรุณาเพิ่มเอกสารหรือแหล่งกฎหมายที่เกี่ยวข้องก่อนใช้ข้อความนี้\n" + (parsedResult.sourceSummary || "");
  }

  if (parsedResult.overallCoverage === 'insufficient' || parsedResult.overallCoverage === 'partial') {
    if (!parsedResult.sourceSummary.includes("ระบบไม่พบแหล่งอ้างอิงที่เพียงพอสำหรับข้อความสำคัญบางส่วน")) {
        parsedResult.sourceSummary = "ระบบไม่พบแหล่งอ้างอิงที่เพียงพอสำหรับข้อความสำคัญบางส่วน กรุณาเพิ่มเอกสารหรือแหล่งกฎหมายที่เกี่ยวข้องก่อนใช้ข้อความนี้\n" + parsedResult.sourceSummary;
    }
  }

  // 5. Store the AI operation in AiQueryLog
  const aiQuery = await prisma.aiQueryLog.create({
    data: {
      userId,
      prompt: userPrompt,
      response: generatedContent,
      tokensUsed: aiResult.meta.usage.totalTokens,
      modelUsed: aiResult.meta.model,
    }
  });

  // 6. Log the audit event
  if (userId) {
    await auditLog({
      userId,
      action: "AI_CITATION_COVERAGE_CHECK_COMPLETED",
      entityType: "DecisionDraftSection",
      entityId: sectionId || "unknown",
      afterValue: JSON.stringify({ 
        model: aiResult.meta.model,
        provider: aiResult.meta.provider,
        usage: aiResult.meta.usage,
        inputHash: aiResult.meta.inputHash,
        redactedCount: aiResult.meta.redactedCount,
        coverageMode, 
        overallCoverage: parsedResult.overallCoverage,
        coverageScore: parsedResult.coverageScore,
        chunkIds,
        aiQueryId: aiQuery.id
      })
    });
  }

  return {
    overallCoverage: parsedResult.overallCoverage || 'insufficient',
    coverageScore: typeof parsedResult.coverageScore === 'number' ? parsedResult.coverageScore : 0,
    riskLevel: parsedResult.riskLevel || 'high',
    sectionType: parsedResult.sectionType || sectionType,
    checkedClaims: Array.isArray(parsedResult.checkedClaims) ? parsedResult.checkedClaims : [],
    missingSupport: Array.isArray(parsedResult.missingSupport) ? parsedResult.missingSupport : [],
    sourceSummary: parsedResult.sourceSummary || "",
    humanReviewWarning: parsedResult.humanReviewWarning,
    retrievedChunksUsed: searchResults
  };
}
