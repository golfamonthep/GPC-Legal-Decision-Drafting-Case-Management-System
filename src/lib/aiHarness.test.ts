import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AiHarnessError,
  createAiHarness,
  getAiHarnessStatus,
  pseudonymizeText,
  restorePseudonyms,
} from '../../shared/ai-harness.mjs';

const schema = {
  type: 'object',
  properties: {
    text: {type: 'string'},
    citations: {type: 'array', items: {type: 'string'}},
    gaps: {type: 'array', items: {type: 'string'}},
  },
  required: ['text', 'citations', 'gaps'],
  additionalProperties: false,
};

const configuredEnv = {
  AI_ENABLED: 'true',
  AI_PROVIDER: 'deepseek',
  AI_API_KEY: 'server-secret',
  AI_BASE_URL: 'https://api.deepseek.com',
  AI_MODEL: 'deepseek-v4-pro',
  AI_TIMEOUT_MS: '90000',
  AI_MAX_OUTPUT_TOKENS: '6000',
};

function providerResponse(data: unknown, overrides: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    id: 'resp-test',
    status: 'completed',
    model: 'deepseek-v4-pro',
    output: [{type: 'message', content: [{type: 'output_text', text: JSON.stringify(data)}]}],
    usage: {input_tokens: 120, output_tokens: 30, total_tokens: 150},
    ...overrides,
  }), {status: 200, headers: {'Content-Type': 'application/json'}});
}

test('disabled or missing-key configuration never becomes callable', async () => {
  assert.deepEqual(getAiHarnessStatus({AI_ENABLED: 'false'}), {
    enabled: false,
    configured: false,
    provider: 'deepseek',
    model: 'deepseek-chat',
    maxBudgetUsd: null,
    currentSpendUsd: 0,
    reason: 'disabled',
  });
  const harness = createAiHarness({env: {...configuredEnv, AI_API_KEY: ''}});
  await assert.rejects(
    harness.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_NOT_CONFIGURED',
  );
});

test('pseudonymization round-trips known Thai case data and common identifiers', () => {
  const source = 'สมชาย ใจดี เลขดำ 123/68 บัตร 1234567890123 โทร 081-234-5678 email test@example.com';
  const redacted = pseudonymizeText(source, [
    {kind: 'PERSON', value: 'สมชาย ใจดี'},
    {kind: 'CASE', value: '123/68'},
  ]);
  assert.equal(redacted.text.includes('สมชาย ใจดี'), false);
  assert.equal(redacted.text.includes('1234567890123'), false);
  assert.equal(redacted.text.includes('081-234-5678'), false);
  assert.equal(redacted.text.includes('test@example.com'), false);
  assert.equal(restorePseudonyms(redacted.text, redacted.mapping), source);
});

test('structured request sends no tools, leaks no identifiers, validates citations and restores output', async () => {
  let capturedUrl = '';
  let capturedInit: RequestInit | undefined;
  const harness = createAiHarness({
    env: configuredEnv,
    fetchImpl: async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return providerResponse({text: 'ความเห็นของ [[PERSON_1]] ในคดี [[CASE_1]] [law-1]', citations: ['law-1'], gaps: []});
    },
  });
  const result = await harness.generateStructured({
    instructions: 'ตอบเป็น json จากแหล่งที่อนุมัติเท่านั้น',
    input: JSON.stringify({person: 'สมชาย ใจดี', case_number: '123/68', source: {id: 'law-1', text: 'ข้อความกฎหมาย'}}),
    schemaName: 'section_proposal',
    schema,
    approvedSourceIds: ['law-1'],
    sensitiveValues: [
      {kind: 'PERSON', value: 'สมชาย ใจดี'},
      {kind: 'CASE', value: '123/68'},
    ],
    userId: 'internal-user-1',
  });

  const body = JSON.parse(String(capturedInit?.body));
  assert.equal(capturedUrl, 'https://api.deepseek.com/chat/completions');
  assert.equal((capturedInit?.headers as Record<string, string>).Authorization, 'Bearer server-secret');
  assert.equal(body.model, 'deepseek-v4-pro');
  assert.equal('tools' in body, false);
  assert.equal(JSON.stringify(body).includes('สมชาย ใจดี'), false);
  assert.equal(JSON.stringify(body).includes('123/68'), false);
  assert.match(body.user, /^u_[a-f0-9]{32}$/);
  assert.deepEqual(result.data, {text: 'ความเห็นของ สมชาย ใจดี ในคดี 123/68 [law-1]', citations: ['law-1'], gaps: []});
  assert.deepEqual(result.meta.usage, {inputTokens: 120, outputTokens: 30, totalTokens: 150});
  assert.equal(result.meta.redactedCount, 2);
  assert.match(result.meta.inputHash, /^[a-f0-9]{64}$/);
});

test('foreign citations and invented pseudonym tokens are rejected', async () => {
  const foreign = createAiHarness({env: configuredEnv, fetchImpl: async () => providerResponse({text: 'ข้อความ', citations: ['outside'], gaps: []})});
  await assert.rejects(
    foreign.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema, approvedSourceIds: ['inside']}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_UNAPPROVED_CITATION',
  );

  const invented = createAiHarness({env: configuredEnv, fetchImpl: async () => providerResponse({text: '[[PERSON_99]]', citations: [], gaps: []})});
  await assert.rejects(
    invented.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_PSEUDONYM_ERROR',
  );
});

test('provider failures are mapped without exposing provider response bodies', async () => {
  const harness = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () => new Response(JSON.stringify({error: {message: 'account secret details'}}), {status: 429}),
  });
  await assert.rejects(
    harness.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema}),
    (error: unknown) => error instanceof AiHarnessError
      && error.code === 'AI_RATE_LIMIT'
      && !error.message.includes('account secret details'),
  );
});

test('401 and 5xx provider failures use safe errors', async () => {
  for (const [status, code] of [[401, 'AI_AUTH'], [500, 'AI_PROVIDER']] as const) {
    const harness = createAiHarness({
      env: configuredEnv,
      fetchImpl: async () => new Response('private provider details', {status}),
    });
    await assert.rejects(
      harness.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema}),
      (error: unknown) => error instanceof AiHarnessError
        && error.code === code
        && !error.message.includes('private provider details'),
    );
  }
});

test('timeout and oversized inputs stop before accepting a provider result', async () => {
  const timeout = createAiHarness({
    env: {...configuredEnv, AI_TIMEOUT_MS: '1000'},
    fetchImpl: async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }),
  });
  await assert.rejects(
    timeout.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_TIMEOUT',
  );

  const oversized = createAiHarness({env: configuredEnv, fetchImpl: async () => providerResponse({text: '', citations: [], gaps: []})});
  await assert.rejects(
    oversized.generateStructured({instructions: 'json', input: 'x'.repeat(300001), schemaName: 'result', schema}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_INPUT_TOO_LARGE',
  );
});

test('schema mismatches and sensitive values appearing only in instructions are rejected or hidden', async () => {
  const invalid = createAiHarness({env: configuredEnv, fetchImpl: async () => providerResponse({text: 'ok', citations: 'law-1', gaps: []})});
  await assert.rejects(
    invalid.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema, approvedSourceIds: ['law-1']}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_INVALID_RESPONSE',
  );

  let requestBody = '';
  const hidden = createAiHarness({
    env: configuredEnv,
    fetchImpl: async (_url, init) => {
      requestBody = String(init?.body);
      return providerResponse({text: '[[PERSON_1]]', citations: [], gaps: []});
    },
  });
  const result = await hidden.generateStructured<{text: string; citations: string[]; gaps: string[]}>({
    instructions: 'พิจารณาเฉพาะ สมชาย ใจดี',
    input: '{}',
    schemaName: 'result',
    schema,
    sensitiveValues: [{kind: 'PERSON', value: 'สมชาย ใจดี'}],
  });
  assert.equal(requestBody.includes('สมชาย ใจดี'), false);
  assert.equal(result.data.text, 'สมชาย ใจดี');
});

test('incomplete or malformed provider output is never accepted', async () => {
  const incomplete = createAiHarness({env: configuredEnv, fetchImpl: async () => providerResponse({}, {status: 'incomplete', incomplete_details: {reason: 'max_output_tokens'}})});
  await assert.rejects(
    incomplete.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_INCOMPLETE',
  );
  const malformed = createAiHarness({env: configuredEnv, fetchImpl: async () => providerResponse({}, {output: [{type: 'message', content: [{type: 'output_text', text: '{bad'}]}]})});
  await assert.rejects(
    malformed.generateStructured({instructions: 'json', input: '{}', schemaName: 'result', schema}),
    (error: unknown) => error instanceof AiHarnessError && error.code === 'AI_INVALID_RESPONSE',
  );
});

test('strips leaked DeepSeek <think> reasoning tags before parsing and inside restored strings', async () => {
  const harness = createAiHarness({
    env: configuredEnv,
    fetchImpl: async () => new Response(JSON.stringify({
      id: 'resp-cot',
      status: 'completed',
      model: 'deepseek-v4-pro',
      output: [{
        type: 'message',
        content: [{
          type: 'output_text',
          text: '<think>Internal chain-of-thought reasoning</think>\n' + JSON.stringify({
            text: '<think>hidden</think>พิเคราะห์แล้วเห็นว่า [[PERSON_1]] [law-1]',
            citations: ['law-1'],
            gaps: [],
          }),
        }],
      }],
      usage: {input_tokens: 40, output_tokens: 20, total_tokens: 60},
    }), {status: 200, headers: {'Content-Type': 'application/json'}}),
  });
  const result = await harness.generateStructured<{text: string; citations: string[]; gaps: string[]}>({
    instructions: 'ร่างเฉพาะส่วน',
    input: 'ผู้ร้อง สมชาย ใจดี',
    schemaName: 'section_proposal',
    schema,
    approvedSourceIds: ['law-1'],
    sensitiveValues: [{kind: 'PERSON', value: 'สมชาย ใจดี'}],
  });
  assert.equal(result.data.text, 'พิเคราะห์แล้วเห็นว่า สมชาย ใจดี [law-1]');
  assert.equal(result.data.text.includes('<think>'), false);
});

