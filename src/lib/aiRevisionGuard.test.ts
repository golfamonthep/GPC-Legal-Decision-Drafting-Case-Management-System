import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiHarness, AiHarnessError } from '../../shared/ai-harness.mjs';
import { StaleRevisionError, toAiRouteError } from './ai/revisionGuard';

(globalThis as any).prismaGlobal ??= {};

const modulesPromise = Promise.all([
  import('./ai/draftSection'),
  import('./ai/legalWordingReviewer'),
  import('./ai/citationCoverageChecker'),
  import('./ai/legalQa'),
]);

const configuredEnv = {
  AI_ENABLED: 'true',
  AI_PROVIDER: 'deepseek',
  AI_API_KEY: 'server-secret',
  AI_BASE_URL: 'https://api.deepseek.com',
  AI_MODEL: 'deepseek-v4-pro',
  AI_TIMEOUT_MS: '90000',
  AI_MAX_OUTPUT_TOKENS: '6000',
};

function providerResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      id: 'resp-rev-test',
      status: 'completed',
      model: 'deepseek-v4-pro',
      output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(data) }] }],
      usage: { input_tokens: 50, output_tokens: 25, total_tokens: 75 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function createFakeDb(initial?: {
  caseUpdatedAt?: string;
  draftUpdatedAt?: string;
  sectionUpdatedAt?: string;
  sectionContent?: string;
  chunkUpdatedAt?: string;
  chunkStatus?: string;
}) {
  const state = {
    caseRow: {
      id: 'case-1',
      blackNumber: 'อท.99/2569',
      redNumber: 'รด.12/2569',
      petitionerName: 'พ.ต.ท. สมศักดิ์ ทดสอบ',
      respondentName: 'พล.ต.ต. ตัวอย่าง สมมติ',
      legalOfficerName: 'ร.ต.อ. นิติกร สมมติ',
      committeeOwnerName: 'พล.ต.อ. กรรมการ สมมติ',
      subject: 'อุทธรณ์คำสั่งแต่งตั้ง',
      type: 'อุทธรณ์',
      legalCategory: 'แต่งตั้งโยกย้าย',
      updatedAt: new Date(initial?.caseUpdatedAt || '2026-04-19T05:00:00.000Z'),
    },
    draftRow: {
      id: 'draft-1',
      caseId: 'case-1',
      updatedAt: new Date(initial?.draftUpdatedAt || '2026-04-19T05:05:00.000Z'),
    },
    sectionRow: {
      id: 'sec-1',
      draftId: 'draft-1',
      sectionType: 'reasoning',
      content: initial?.sectionContent ?? 'ร่างเดิมของมนุษย์',
      status: 'in_progress',
      updatedAt: new Date(initial?.sectionUpdatedAt || '2026-04-19T05:10:00.000Z'),
    },
    chunkRow: {
      id: 'chunk-1',
      updatedAt: new Date(initial?.chunkUpdatedAt || '2026-04-19T04:00:00.000Z'),
      sourceStatus: initial?.chunkStatus || 'ใช้งาน',
      content: 'หลักเกณฑ์ตามมาตรา 88',
    },
    draftLogs: [] as any[],
    aiQueryLogs: [] as any[],
    retrievalQueries: [] as any[],
    legalAnswers: [] as any[],
  };

  return {
    state,
    db: {
      case: {
        findUnique: async ({ where }: any) => (where.id === state.caseRow.id ? { ...state.caseRow } : null),
      },
      decisionDraft: {
        findUnique: async ({ where }: any) => (where.id === state.draftRow.id ? { ...state.draftRow } : null),
      },
      decisionDraftSection: {
        findUnique: async ({ where }: any) =>
          where.id === state.sectionRow.id
            ? { ...state.sectionRow, draft: { ...state.draftRow } }
            : null,
      },
      documentChunk: {
        findMany: async ({ where }: any) => {
          const ids: string[] = where?.id?.in || [];
          return ids.includes(state.chunkRow.id) && state.chunkRow.sourceStatus !== 'DELETED'
            ? [{ ...state.chunkRow }]
            : [];
        },
      },
      draftSectionAiLog: {
        create: async ({ data }: any) => {
          const row = { id: `log-${state.draftLogs.length + 1}`, ...data };
          state.draftLogs.push(row);
          return row;
        },
      },
      aiQueryLog: {
        create: async ({ data }: any) => {
          const row = { id: `qlog-${state.aiQueryLogs.length + 1}`, ...data };
          state.aiQueryLogs.push(row);
          return row;
        },
      },
      retrievalQuery: {
        create: async ({ data }: any) => {
          const row = { id: `rq-${state.retrievalQueries.length + 1}`, ...data };
          state.retrievalQueries.push(row);
          return row;
        },
      },
      legalAnswer: {
        create: async ({ data }: any) => {
          const row = { id: `ans-${state.legalAnswers.length + 1}`, ...data };
          state.legalAnswers.push(row);
          return row;
        },
      },
      legalAnswerCitation: {
        createMany: async () => ({ count: 1 }),
      },
    },
  };
}

const mockChunks = [
  {
    chunkId: 'chunk-1',
    sourceId: 'src-1',
    sourceTitle: 'พ.ร.บ.ตำรวจแห่งชาติ พ.ศ. 2565',
    sourceType: 'Act',
    content: 'หลักเกณฑ์ตามมาตรา 88',
    score: 0.92,
    citationMetadata: { referenceNumber: 'ม.88' },
  },
];

test('generateDraftSection rejects stale revision before calling provider and when human edits during AI processing', async () => {
  const [{ generateDraftSection }] = await modulesPromise;
  const { db, state } = createFakeDb();
  let providerCalls = 0;

  // 1) Pre-flight stale revision -> 409 without contacting provider
  const harnessPre = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () => {
      providerCalls++;
      return providerResponse({ text: 'ร่างใหม่', citations: ['chunk-1'], gaps: [] });
    },
  });

  await assert.rejects(
    generateDraftSection(
      {
        caseId: 'case-1',
        draftId: 'draft-1',
        sectionId: 'sec-1',
        sectionType: 'reasoning',
        userInstruction: 'สรุปเหตุผลตามมาตรา 88',
        expectedSectionUpdatedAt: '2026-04-19T05:00:00.000Z', // stale
      },
      { db, harness: harnessPre, searchChunksFn: async () => mockChunks as any, auditLogFn: async () => {} },
    ),
    (err: unknown) => err instanceof StaleRevisionError && err.status === 409,
  );
  assert.equal(providerCalls, 0);
  assert.equal(state.draftLogs.length, 0);

  // 2) Concurrent human edit while AI is in flight -> 409 and never writes log
  const harnessMidFlight = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () => {
      providerCalls++;
      // Simulate human saving new content while AI is running
      state.sectionRow.content = 'มนุษย์แก้ไขข้อความระหว่างรอ AI';
      state.sectionRow.updatedAt = new Date('2026-04-19T05:12:00.000Z');
      return providerResponse({ text: 'ร่างจาก AI ที่ล้าสมัย', citations: ['chunk-1'], gaps: [] });
    },
  });

  await assert.rejects(
    generateDraftSection(
      {
        caseId: 'case-1',
        draftId: 'draft-1',
        sectionId: 'sec-1',
        sectionType: 'reasoning',
        userInstruction: 'สรุปเหตุผลตามมาตรา 88',
        expectedSectionUpdatedAt: '2026-04-19T05:10:00.000Z',
      },
      { db, harness: harnessMidFlight, searchChunksFn: async () => mockChunks as any, auditLogFn: async () => {} },
    ),
    (err: unknown) => err instanceof StaleRevisionError && err.status === 409,
  );
  assert.equal(providerCalls, 1);
  assert.equal(state.draftLogs.length, 0);

  // 3) Matching revision succeeds and redacts PII in DB prompt log
  const harnessOk = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () =>
      providerResponse({
        text: 'วินิจฉัยของ [[PERSON_1]] ในคดี [[CASE_1]] [chunk-1]',
        citations: ['chunk-1'],
        gaps: [],
      }),
  });

  const okResult = await generateDraftSection(
    {
      caseId: 'case-1',
      draftId: 'draft-1',
      sectionId: 'sec-1',
      sectionType: 'reasoning',
      userInstruction: 'สรุปของ พ.ต.ท. สมศักดิ์ ทดสอบ',
      expectedSectionUpdatedAt: '2026-04-19T05:12:00.000Z',
    },
    { db, harness: harnessOk, searchChunksFn: async () => mockChunks as any, auditLogFn: async () => {} },
  );

  assert.equal(okResult.generatedText, 'วินิจฉัยของ พล.ต.ต. ตัวอย่าง สมมติ ในคดี อท.99/2569 [chunk-1]');
  assert.equal(okResult.revision.sectionUpdatedAt, '2026-04-19T05:12:00.000Z');
  assert.equal(state.draftLogs.length, 1);
  assert.equal(state.draftLogs[0].prompt.includes('พ.ต.ท. สมศักดิ์ ทดสอบ'), false);
  assert.equal(state.draftLogs[0].prompt.includes('อท.99/2569'), false);
});

test('reviewLegalWording and checkCitationCoverage reject mid-flight draft modifications with 409', async () => {
  const [, { reviewLegalWording }, { checkCitationCoverage }] = await modulesPromise;
  const { db, state } = createFakeDb();

  const harnessWording = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () => {
      // Simulate concurrent draft modification while wording review is running
      state.sectionRow.updatedAt = new Date('2026-04-19T05:20:00.000Z');
      return providerResponse({
        overallAssessment: 'ดี',
        riskLevel: 'low',
        canSuggestRewrite: true,
        issues: [],
        improvedSectionText: 'ข้อความปรับปรุง',
        citationNotes: 'ครบ',
        humanReviewWarning: 'เตือน',
      });
    },
  });

  await assert.rejects(
    reviewLegalWording(
      {
        caseId: 'case-1',
        draftId: 'draft-1',
        sectionId: 'sec-1',
        sectionType: 'reasoning',
        currentSectionText: 'ร่างเดิมของมนุษย์',
        reviewMode: 'legal_style',
        expectedSectionUpdatedAt: '2026-04-19T05:10:00.000Z',
      },
      { db, harness: harnessWording, searchChunksFn: async () => mockChunks as any, auditLogFn: async () => {} },
    ),
    (err: unknown) => err instanceof StaleRevisionError && err.status === 409,
  );
  assert.equal(state.aiQueryLogs.length, 0);

  const harnessCoverage = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () => {
      // Simulate retrieved source chunk changing status during citation check
      state.chunkRow.sourceStatus = 'ยกเลิก';
      return providerResponse({
        overallCoverage: 'sufficient',
        coverageScore: 95,
        riskLevel: 'low',
        sectionType: 'reasoning',
        checkedClaims: [],
        missingSupport: [],
        sourceSummary: 'ครบ',
        humanReviewWarning: 'เตือน',
      });
    },
  });

  await assert.rejects(
    checkCitationCoverage(
      {
        caseId: 'case-1',
        draftId: 'draft-1',
        sectionId: 'sec-1',
        sectionType: 'reasoning',
        currentSectionText: 'ร่างเดิมของมนุษย์',
        coverageMode: 'legal_basis',
        expectedSectionUpdatedAt: '2026-04-19T05:20:00.000Z',
      },
      { db, harness: harnessCoverage, searchChunksFn: async () => mockChunks as any, auditLogFn: async () => {} },
    ),
    (err: unknown) => err instanceof StaleRevisionError && err.status === 409,
  );
  assert.equal(state.aiQueryLogs.length, 0);
});

test('generateLegalAnswer rejects stale case/section or source chunk revision with 409 and maps route errors safely', async () => {
  const [, , , { generateLegalAnswer }] = await modulesPromise;
  const { db, state } = createFakeDb();

  const harnessQa = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () => {
      state.chunkRow.updatedAt = new Date('2026-04-19T06:00:00.000Z');
      return providerResponse({
        answer: 'คำตอบตาม [chunk-1]',
        citations: ['chunk-1'],
      });
    },
  });

  await assert.rejects(
    generateLegalAnswer(
      {
        query: 'หลักเกณฑ์ตามมาตรา 88 ของ พ.ต.ท. สมศักดิ์ ทดสอบ คืออะไร',
        caseId: 'case-1',
        draftId: 'draft-1',
        sectionId: 'sec-1',
        expectedSectionUpdatedAt: '2026-04-19T05:10:00.000Z',
      },
      { db, harness: harnessQa, searchChunksFn: async () => mockChunks as any, auditLogFn: async () => {} },
    ),
    (err: unknown) => err instanceof StaleRevisionError && err.status === 409,
  );
  assert.equal(state.legalAnswers.length, 0);
  assert.equal(state.retrievalQueries[0].queryText.includes('พ.ต.ท. สมศักดิ์ ทดสอบ'), false);

  // Verify toAiRouteError mapping
  assert.equal(toAiRouteError(new Error('UNAUTHORIZED'), 'fallback').status, 401);
  assert.equal(toAiRouteError(new Error('FORBIDDEN'), 'fallback').status, 403);
  assert.equal(toAiRouteError(new StaleRevisionError(), 'fallback').status, 409);
  assert.equal(toAiRouteError(new AiHarnessError('AI_DISABLED', 503), 'fallback').status, 503);
  const internalMapped = toAiRouteError(new Error('select * from secret_table failed'), 'ระบบขัดข้อง');
  assert.equal(internalMapped.status, 500);
  assert.equal(internalMapped.body.error, 'ระบบขัดข้อง');
});
