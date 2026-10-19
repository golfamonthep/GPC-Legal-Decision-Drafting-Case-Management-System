import prisma from '@/lib/db';
import { searchChunks } from '@/lib/rag/retrieval/searchChunks';
import { auditLog } from '@/lib/audit';
import { createAiHarness, pseudonymizeText } from '../../../shared/ai-harness.mjs';
import {
  assertDraftRevisionUnchanged,
  captureDraftRevisionSnapshot,
  DraftRevisionExpectation,
  DraftRevisionSnapshot,
} from './revisionGuard';

export interface GenerateDraftSectionParams extends DraftRevisionExpectation {
  caseId: string;
  draftId: string;
  sectionId: string;
  sectionType: string;
  userInstruction: string;
  userId?: string;
  legalCategory?: string;
}

export interface GenerateDraftSectionResponse {
  generatedText: string;
  sourcesUsed: any[];
  revision: DraftRevisionSnapshot;
}

export interface DraftSectionDeps {
  db?: any;
  searchChunksFn?: typeof searchChunks;
  harness?: ReturnType<typeof createAiHarness>;
  auditLogFn?: (...args: Parameters<typeof auditLog>) => Promise<unknown>;
}

export async function generateDraftSection(
  params: GenerateDraftSectionParams,
  deps: DraftSectionDeps = {},
): Promise<GenerateDraftSectionResponse> {
  const {
    caseId,
    draftId,
    sectionId,
    sectionType,
    userInstruction,
    userId,
    legalCategory,
    expectedCaseUpdatedAt,
    expectedDraftUpdatedAt,
    expectedSectionUpdatedAt,
    expectedSectionContent,
  } = params;
  const db = deps.db ?? prisma;
  const searchChunksFn = deps.searchChunksFn ?? searchChunks;
  const harness = deps.harness ?? createAiHarness();
  const auditLogFn = deps.auditLogFn ?? auditLog;

  // 1. Load case/draft/section metadata & validate baseline revision before AI runs
  const { caseData, snapshot } = await captureDraftRevisionSnapshot(
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

  // 2. Retrieval using searchChunks (using hybrid search for best results)
  const searchQuery = userInstruction; // We search using the user's instruction
  
  const searchResults = await searchChunksFn({
    query: searchQuery,
    mode: 'hybrid',
    userId,
    filters: {
      legalCategory: legalCategory || caseData.legalCategory,
      sourceStatus: 'ใช้งาน',
      reliabilityLevels: ['official', 'internal']
    },
    topK: 10
  });

  if (!searchResults || searchResults.length === 0) {
    throw new Error('No relevant legal sources found. Refusing to draft without approved sources.');
  }

  // Extract chunk contents and ids
  const contextChunks = searchResults.map(r => `Source ID: ${r.chunkId}\nSource: ${r.sourceTitle}\nCitation: ${r.citationMetadata?.referenceNumber || 'N/A'}\nContent:\n${r.content}`).join('\n\n---\n\n');
  const chunkIds = searchResults.map(r => r.chunkId);
  const chunkSnapshot = await import('./revisionGuard').then(m => m.captureChunkRevisionSnapshot(chunkIds, db));

  // 3. Construct system and user prompts
  const systemPrompt = `You are an AI assistant assisting a legal officer in drafting a single section of a ก.พ.ค.ตร. decision.

CRITICAL RULES:
1. You MUST use ONLY the provided retrieved context. Do NOT use general model knowledge.
2. You MUST NOT invent any facts, names, dates, case numbers, law sections, or conclusions.
3. If the provided context is insufficient to fulfill the user's instruction, state clearly that the evidence is insufficient.
4. You must write in formal Thai legal/government style (ภาษาไทยแบบราชการ/ภาษากฎหมาย).
5. You are drafting ONLY ONE SECTION of the decision (Section Type: ${sectionType}). Do NOT write the entire decision.
6. Use cautious legal wording.
7. Include citation references (อ้างอิง) inline where appropriate, based on the provided context.
8. Do NOT determine the final outcome or result of the case unless explicitly requested in the user's instruction based on the facts provided.
9. Return JSON only. Put every used Source ID in citations and list missing information in gaps.`;

  const userPrompt = `Case Details:
- Case Number (Black): ${caseData.blackNumber}
- Petitioner: ${caseData.petitionerName}
- Respondent: ${caseData.respondentName}
- Subject: ${caseData.subject}
- Case Type: ${caseData.type}

User Instruction for this section (${sectionType}):
${userInstruction}

Retrieved Context (USE ONLY THESE SOURCES):
${contextChunks}

Please draft the section based on the above instruction and context.`;

  const sensitiveValues: Array<{ kind: 'PERSON' | 'CASE' | 'ID'; value: string }> = [
    { kind: 'PERSON', value: caseData.petitionerName || '' },
    { kind: 'PERSON', value: caseData.respondentName || '' },
    { kind: 'PERSON', value: caseData.legalOfficerName || '' },
    { kind: 'PERSON', value: caseData.committeeOwnerName || '' },
    { kind: 'CASE', value: caseData.blackNumber || '' },
    { kind: 'CASE', value: caseData.redNumber || '' },
  ];

  // 4. Call LLM
  const aiResult = await harness.generateStructured<{text: string; citations: string[]; gaps: string[]}>({
    instructions: systemPrompt,
    input: userPrompt,
    schemaName: 'draft_section',
    schema: {
      type: 'object',
      properties: {
        text: {type: 'string'},
        citations: {type: 'array', items: {type: 'string'}},
        gaps: {type: 'array', items: {type: 'string'}},
      },
      required: ['text', 'citations', 'gaps'],
      additionalProperties: false,
    },
    approvedSourceIds: chunkIds,
    sensitiveValues,
    userId,
  });

  // 4b. Re-verify revision after AI completes; abort with 409 if case/draft/section/sources changed
  await assertDraftRevisionUnchanged(snapshot, db);
  const { assertChunkRevisionUnchanged } = await import('./revisionGuard');
  await assertChunkRevisionUnchanged(chunkSnapshot, db);

  const generatedText = aiResult.data.text;
  const redactedPrompt = pseudonymizeText(userPrompt, sensitiveValues).text;
  const redactedInstruction = pseudonymizeText(userInstruction, sensitiveValues).text;

  // 5. Store the AI operation in DraftSectionAiLog
  await db.draftSectionAiLog.create({
    data: {
      caseId,
      draftId,
      sectionId,
      sectionType,
      userInstruction: redactedInstruction,
      prompt: redactedPrompt,
      generatedText,
      modelUsed: aiResult.meta.model,
      userId,
      chunkIds,
    }
  });

  // 6. Log the audit event
  if (userId) {
    await auditLogFn({
      userId,
      action: "AI_DRAFT_SECTION_GENERATED",
      entityType: "DecisionDraftSection",
      entityId: sectionId,
      afterValue: JSON.stringify({model: aiResult.meta.model, provider: aiResult.meta.provider, usage: aiResult.meta.usage, inputHash: aiResult.meta.inputHash, redactedCount: aiResult.meta.redactedCount, sourcesCount: chunkIds.length, sectionUpdatedAt: snapshot.sectionUpdatedAt})
    });
  }

  return {
    generatedText,
    sourcesUsed: searchResults,
    revision: snapshot,
  };
}

