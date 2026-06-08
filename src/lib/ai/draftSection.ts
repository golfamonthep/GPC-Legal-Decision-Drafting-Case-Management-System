import { PrismaClient } from '@/generated/prisma';
import prisma from '@/lib/db';
import OpenAI from 'openai';
import { searchChunks } from '@/lib/rag/retrieval/searchChunks';
import { auditLog } from '@/lib/audit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

const AI_MODEL = process.env.AI_DRAFT_MODEL || "gpt-4o-mini";

export interface GenerateDraftSectionParams {
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
}

export async function generateDraftSection(params: GenerateDraftSectionParams): Promise<GenerateDraftSectionResponse> {
  const { caseId, draftId, sectionId, sectionType, userInstruction, userId, legalCategory } = params;

  // 1. Load case metadata
  const caseData = await prisma.case.findUnique({
    where: { id: caseId }
  });

  if (!caseData) {
    throw new Error(`Case not found: ${caseId}`);
  }

  // 2. Retrieval using searchChunks (using hybrid search for best results)
  const searchQuery = userInstruction; // We search using the user's instruction
  
  const searchResults = await searchChunks({
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
  const contextChunks = searchResults.map(r => `Source: ${r.sourceTitle}\nCitation: ${r.citationMetadata?.referenceNumber || 'N/A'}\nContent:\n${r.content}`).join('\n\n---\n\n');
  const chunkIds = searchResults.map(r => r.chunkId);

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
8. Do NOT determine the final outcome or result of the case unless explicitly requested in the user's instruction based on the facts provided.`;

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

  // 4. Call LLM
  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1, // Keep it deterministic and factual
  });

  const generatedText = response.choices[0].message.content || "";

  // 5. Store the AI operation in DraftSectionAiLog
  await prisma.draftSectionAiLog.create({
    data: {
      caseId,
      draftId,
      sectionId,
      sectionType,
      userInstruction,
      prompt: userPrompt,
      generatedText,
      modelUsed: AI_MODEL,
      userId,
      chunkIds,
    }
  });

  // 6. Log the audit event
  if (userId) {
    await auditLog({
      userId,
      action: "AI_DRAFT_SECTION_GENERATED",
      entityType: "DecisionDraftSection",
      entityId: sectionId,
      afterValue: JSON.stringify({ model: AI_MODEL, sourcesCount: chunkIds.length })
    });
  }

  return {
    generatedText,
    sourcesUsed: searchResults
  };
}
