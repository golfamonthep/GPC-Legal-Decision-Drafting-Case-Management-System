import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import path from 'node:path';

const DEFAULTS = Object.freeze({
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  timeoutMs: 90000,
  maxOutputTokens: 6000,
  maxInputChars: 300000,
});

const SAFE_MESSAGES = Object.freeze({
  AI_DISABLED: 'ผู้ดูแลระบบยังไม่เปิดใช้งาน AI',
  AI_NOT_CONFIGURED: 'ระบบ AI ยังไม่ได้ตั้งค่า API key',
  AI_INPUT_TOO_LARGE: 'ข้อมูลสำหรับ AI ยาวเกินกำหนด โปรดเลือกเฉพาะส่วนที่เกี่ยวข้อง',
  AI_AUTH: 'API key ของบริการ AI ใช้งานไม่ได้',
  AI_RATE_LIMIT: 'บริการ AI ถึงขีดจำกัดหรือเครดิตไม่เพียงพอ กรุณาตรวจบัญชี',
  AI_BUDGET_EXCEEDED: 'ค่าใช้จ่าย AI สะสมถึงเพดานงบประมาณที่กำหนดไว้แล้ว',
  AI_TIMEOUT: 'บริการ AI ใช้เวลานานเกินกำหนด กรุณาลองใหม่',
  AI_INCOMPLETE: 'AI ส่งคำตอบไม่ครบ จึงไม่นำผลมาใช้',
  AI_INVALID_RESPONSE: 'AI ส่งผลลัพธ์ไม่ตรงโครงสร้างที่ระบบกำหนด',
  AI_UNAPPROVED_CITATION: 'AI อ้างแหล่งที่ไม่ได้อนุมัติสำหรับงานนี้',
  AI_PSEUDONYM_ERROR: 'AI ส่งตัวระบุข้อมูลส่วนบุคคลที่ระบบคืนค่าไม่ได้',
  AI_PROVIDER: 'บริการ AI ไม่สำเร็จ กรุณาลองใหม่',
});

export class AiHarnessError extends Error {
  constructor(code, status = 503, options) {
    super(SAFE_MESSAGES[code] || SAFE_MESSAGES.AI_PROVIDER, options);
    this.name = 'AiHarnessError';
    this.code = code;
    this.status = status;
  }
}

function positiveInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function configFrom(env) {
  const provider = String(env.AI_PROVIDER || DEFAULTS.provider).trim().toLowerCase();
  return {
    enabled: String(env.AI_ENABLED || '').toLowerCase() === 'true',
    provider,
    apiKey: String(env.AI_API_KEY || '').trim(),
    baseUrl: String(env.AI_BASE_URL || (provider === 'openai' ? 'https://api.openai.com/v1' : DEFAULTS.baseUrl)).trim().replace(/\/+$/, ''),
    model: String(env.AI_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : DEFAULTS.model)).trim(),
    timeoutMs: positiveInt(env.AI_TIMEOUT_MS, DEFAULTS.timeoutMs, 1000, 120000),
    maxOutputTokens: positiveInt(env.AI_MAX_OUTPUT_TOKENS, DEFAULTS.maxOutputTokens, 1, 20000),
    maxBudgetUsd: Number.parseFloat(String(env.AI_MAX_BUDGET_USD || '0')) || 0,
  };
}

function getLedgerPath(env = process.env) {
  const dir = env.ANALYSIS_STATE_DIR || path.join(process.cwd(), '.state');
  try { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); } catch {}
  return path.join(dir, 'ai-spend-ledger.json');
}

export function getCumulativeSpend(env = process.env) {
  try {
    const loc = getLedgerPath(env);
    if (existsSync(loc)) {
      const data = JSON.parse(readFileSync(loc, 'utf8'));
      return Number(data?.totalUsd || 0);
    }
  } catch {}
  return 0;
}

export function recordSpend(inputTokens, outputTokens, model, env = process.env) {
  try {
    const loc = getLedgerPath(env);
    let current = { totalTokens: 0, totalUsd: 0, calls: 0 };
    if (existsSync(loc)) {
      try { current = JSON.parse(readFileSync(loc, 'utf8')); } catch {}
    }
    const isReasoner = String(model).includes('reasoner');
    const inputRate = isReasoner ? 0.00000055 : 0.00000027;
    const outputRate = isReasoner ? 0.00000219 : 0.00000110;
    const costUsd = (inputTokens * inputRate) + (outputTokens * outputRate);
    current.totalTokens = (current.totalTokens || 0) + inputTokens + outputTokens;
    current.totalUsd = Number(((current.totalUsd || 0) + costUsd).toFixed(6));
    current.calls = (current.calls || 0) + 1;
    current.lastUpdated = new Date().toISOString();
    writeFileSync(loc, JSON.stringify(current, null, 2), 'utf8');
    return current.totalUsd;
  } catch {
    return 0;
  }
}

export function getAiHarnessStatus(env = process.env) {
  const config = configFrom(env);
  const configured = Boolean(config.apiKey && config.baseUrl && config.model);
  const currentSpend = getCumulativeSpend(env);
  return {
    enabled: config.enabled,
    configured,
    provider: config.provider,
    model: config.model,
    maxBudgetUsd: config.maxBudgetUsd || null,
    currentSpendUsd: currentSpend,
    reason: !config.enabled ? 'disabled' : configured ? 'ready' : 'missing_key',
  };
}

function collectDetectedIdentifiers(text) {
  const patterns = [
    /(?<!\d)(?:\d[\s-]?){12}\d(?!\d)/g,
    /(?:\+66|0)\d(?:[\s-]?\d){7,9}(?!\d)/g,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  ];
  return patterns.flatMap(pattern => Array.from(text.matchAll(pattern), match => match[0]));
}

function buildMapping(text, sensitiveValues) {
  const counters = {PERSON: 0, CASE: 0, ID: 0};
  const seen = new Set();
  const entries = [];
  for (const item of sensitiveValues || []) {
    const kind = ['PERSON', 'CASE', 'ID'].includes(item?.kind) ? item.kind : 'ID';
    const value = typeof item?.value === 'string' ? item.value.trim() : '';
    if (value && text.includes(value) && !seen.has(value)) {
      seen.add(value);
      entries.push({kind, value});
    }
  }
  for (const value of collectDetectedIdentifiers(text)) {
    if (value && !seen.has(value)) {
      seen.add(value);
      entries.push({kind: 'ID', value});
    }
  }
  entries.sort((a, b) => b.value.length - a.value.length);
  return entries.map(({kind, value}) => ({kind, value, token: `[[${kind}_${++counters[kind]}]]`}));
}

function replaceWithTokens(text, mapping) {
  let output = text;
  for (const item of mapping) output = output.split(item.value).join(item.token);
  for (const item of mapping) {
    if (output.includes(item.value)) throw new AiHarnessError('AI_PSEUDONYM_ERROR', 400);
  }
  return output;
}

export function pseudonymizeText(value, sensitiveValues = []) {
  const text = String(value ?? '');
  const mapping = buildMapping(text, sensitiveValues);
  return {text: replaceWithTokens(text, mapping), mapping};
}

function stripCotLeakage(value) {
  return String(value ?? '')
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/<\/?think>/gi, '');
}

export function restorePseudonyms(value, mapping = []) {
  let text = stripCotLeakage(value);
  const known = new Set(mapping.map(item => item.token));
  for (const token of text.match(/\[\[(?:PERSON|CASE|ID)_\d+\]\]/g) || []) {
    if (!known.has(token)) throw new AiHarnessError('AI_PSEUDONYM_ERROR', 502);
  }
  for (const item of mapping) text = text.split(item.token).join(item.value);
  return text;
}

function restoreValue(value, mapping) {
  if (typeof value === 'string') return restorePseudonyms(value, mapping);
  if (Array.isArray(value)) return value.map(item => restoreValue(item, mapping));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restoreValue(item, mapping)]));
  return value;
}

function validateSchema(value, schema, path = '$') {
  if (!schema || typeof schema !== 'object') throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
    for (const key of schema.required || []) if (!(key in value)) throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!(key in (schema.properties || {}))) throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
    }
    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (key in value) validateSchema(value[key], childSchema, `${path}.${key}`);
    }
    return;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
    for (let index = 0; index < value.length; index++) validateSchema(value[index], schema.items || {}, `${path}[${index}]`);
    return;
  }
  if (schema.type === 'string' && typeof value !== 'string') throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
  if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
  if (schema.type === 'integer' && !Number.isSafeInteger(value)) throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
  if (schema.type === 'boolean' && typeof value !== 'boolean') throw new AiHarnessError('AI_INVALID_RESPONSE', 502);
}

const CITATION_KEYS = new Set(['citations', 'sourceIds', 'sourceChunkIds', 'supportingSourceChunkIds']);
function validateCitationIds(value, approved, key = '') {
  if (CITATION_KEYS.has(key)) {
    if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || !approved.has(id))) {
      throw new AiHarnessError('AI_UNAPPROVED_CITATION', 502);
    }
  }
  if (Array.isArray(value)) for (const item of value) validateCitationIds(item, approved);
  else if (value && typeof value === 'object') for (const [childKey, child] of Object.entries(value)) validateCitationIds(child, approved, childKey);
}

function extractOutputText(payload) {
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        return stripCotLeakage(content.text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      }
    }
  }
  if (Array.isArray(payload?.choices)) {
    for (const choice of payload.choices) {
      const msg = choice?.message;
      const text = msg?.content || msg?.reasoning_content;
      if (typeof text === 'string' && text.trim()) {
        return stripCotLeakage(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      }
    }
  }
  return '';
}

function usageFrom(payload) {
  return {
    inputTokens: Number(payload?.usage?.input_tokens ?? payload?.usage?.prompt_tokens ?? 0),
    outputTokens: Number(payload?.usage?.output_tokens ?? payload?.usage?.completion_tokens ?? 0),
    totalTokens: Number(payload?.usage?.total_tokens ?? 0),
  };
}

function mapHttpError(status) {
  if (status === 401 || status === 403) return new AiHarnessError('AI_AUTH', 502);
  if (status === 402 || status === 429) return new AiHarnessError('AI_RATE_LIMIT', 503);
  return new AiHarnessError('AI_PROVIDER', 502);
}

export function createAiHarness({env = process.env, fetchImpl = globalThis.fetch} = {}) {
  const config = configFrom(env);
  return {
    status: getAiHarnessStatus(env),
    async generateStructured(request) {
      if (!config.enabled) throw new AiHarnessError('AI_DISABLED', 503);
      if (!config.apiKey || !config.baseUrl || !config.model) throw new AiHarnessError('AI_NOT_CONFIGURED', 503);
      if (config.maxBudgetUsd > 0 && getCumulativeSpend(env) >= config.maxBudgetUsd) {
        throw new AiHarnessError('AI_BUDGET_EXCEEDED', 429);
      }
      const originalInput = typeof request.input === 'string' ? request.input : JSON.stringify(request.input);
      if (originalInput.length > DEFAULTS.maxInputChars) throw new AiHarnessError('AI_INPUT_TOO_LARGE', 413);
      const originalInstructions = String(request.instructions || '');
      const mapping = buildMapping(`${originalInstructions}\n${originalInput}`, request.sensitiveValues || []);
      const redacted = {text: replaceWithTokens(originalInput, mapping), mapping};
      const redactedInstructions = replaceWithTokens(originalInstructions, mapping);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      let response;
      const isResponsesApi = config.baseUrl.endsWith('/responses');
      const url = isResponsesApi
        ? config.baseUrl
        : config.baseUrl.endsWith('/chat/completions')
          ? config.baseUrl
          : `${config.baseUrl}/chat/completions`;

      const requestBody = isResponsesApi
        ? {
            model: config.model,
            store: false,
            max_output_tokens: config.maxOutputTokens,
            reasoning: {effort: 'low'},
            instructions: redactedInstructions,
            input: redacted.text,
            text: {format: {type: 'json_schema', name: request.schemaName, strict: true, schema: request.schema}},
            ...(request.userId ? {user: `u_${createHash('sha256').update(String(request.userId)).digest('hex').slice(0, 32)}`} : {}),
          }
        : {
            model: config.model,
            messages: [
              {
                role: 'system',
                content: `${redactedInstructions}\n\nCRITICAL: Return ONLY a valid JSON object matching this schema:\n${JSON.stringify(request.schema)}`
              },
              {
                role: 'user',
                content: redacted.text
              }
            ],
            response_format: {type: 'json_object'},
            max_tokens: config.maxOutputTokens,
            stream: false,
            ...(request.userId ? {user: `u_${createHash('sha256').update(String(request.userId)).digest('hex').slice(0, 32)}`} : {})
          };

      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: {Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json'},
          signal: controller.signal,
          body: JSON.stringify(requestBody),
        });
      } catch (error) {
        if (error instanceof AiHarnessError) throw error;
        if (controller.signal.aborted || error?.name === 'AbortError') throw new AiHarnessError('AI_TIMEOUT', 504, {cause: error});
        throw new AiHarnessError('AI_PROVIDER', 502, {cause: error});
      } finally {
        clearTimeout(timer);
      }
      if (!response?.ok) throw mapHttpError(response?.status || 503);
      let payload;
      try {
        payload = await response.json();
      } catch (error) {
        throw new AiHarnessError('AI_INVALID_RESPONSE', 502, {cause: error});
      }
      const isCompleted = payload.status === 'completed' || (Array.isArray(payload?.choices) && payload.choices.length > 0);
      if (!isCompleted) throw new AiHarnessError('AI_INCOMPLETE', 502);
      const output = extractOutputText(payload);
      let parsed;
      try {
        parsed = JSON.parse(output);
      } catch (error) {
        throw new AiHarnessError('AI_INVALID_RESPONSE', 502, {cause: error});
      }
      validateSchema(parsed, request.schema);
      validateCitationIds(parsed, new Set(request.approvedSourceIds || []));
      const usage = usageFrom(payload);
      if (config.maxBudgetUsd > 0) {
        recordSpend(usage.inputTokens, usage.outputTokens, config.model, env);
      }
      const data = restoreValue(parsed, redacted.mapping);
      return {
        data,
        meta: {
          provider: config.provider,
          model: payload.model || config.model,
          responseId: payload.id || null,
          usage,
          cumulativeSpendUsd: getCumulativeSpend(env),
          inputHash: createHash('sha256').update(originalInput).digest('hex'),
          redactedCount: redacted.mapping.length,
        },
      };
    },
  };
}
