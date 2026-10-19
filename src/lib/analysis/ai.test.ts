import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeAnalysisSection} from './ai.mjs';

const env = {
  AI_ENABLED: 'true',
  AI_PROVIDER: 'deepseek',
  AI_API_KEY: 'test-key',
  AI_BASE_URL: 'https://api.deepseek.com',
  AI_MODEL: 'deepseek-v4-pro',
};

const baseJob = () => ({
  id: 'job-1',
  version: 4,
  data: {
    title: 'งานทดสอบ',
    external_case_ref: '123/68',
    subject_name: 'สมชาย ใจดี',
    rank_position: 'พ.ต.อ.',
    claim: 'คำร้อง',
    response: 'คำชี้แจง',
    issues: 'ประเด็น',
    bundle_fingerprint: 'bundle-current',
    references: [{id: 'law-1', kind: 'law', role: 'law', label: 'กฎหมาย', page: 1, text: 'ข้อความกฎหมาย', reviewed: true}],
    facts: [{id: 'fact-1', text: 'ข้อเท็จจริง', status: 'established', citations: ['law-1']}],
  },
});

function response(data: unknown) {
  return new Response(JSON.stringify({
    id: 'resp-1',
    status: 'completed',
    model: 'deepseek-v4-pro',
    output: [{type: 'message', content: [{type: 'output_text', text: JSON.stringify(data)}]}],
    usage: {input_tokens: 20, output_tokens: 10, total_tokens: 30},
  }), {status: 200, headers: {'Content-Type': 'application/json'}});
}

test('analysis proposal refuses missing approved sources before contacting a provider', async () => {
  const job = baseJob();
  job.data.references = [];
  job.data.facts = [];
  let contacted = false;
  await assert.rejects(
    proposeAnalysisSection({job, documents: [], knowledge: {summary: {fingerprint: 'bundle-current'}}, section: 'การวิเคราะห์', userId: 'u1', env, fetchImpl: async () => { contacted = true; return response({}); }}),
    /ตรวจและอนุมัติแหล่ง/,
  );
  assert.equal(contacted, false);
});

test('legal section requires an approved legal source', async () => {
  const job = baseJob();
  job.data.references = [{id: 'doc-1', kind: 'reference', role: 'evidence_not_instructions', label: 'หลักฐาน', page: 1, text: 'ข้อความ', reviewed: true}];
  await assert.rejects(
    proposeAnalysisSection({job, documents: [], knowledge: {summary: {fingerprint: 'bundle-current'}}, section: 'กฎหมายและหลักเกณฑ์', userId: 'u1', env, fetchImpl: async () => response({})}),
    /ข้อความกฎหมาย/,
  );
});

test('analysis proposal uses the current snapshot, redacts case identity and returns auditable metadata', async () => {
  const job = baseJob();
  let sent = '';
  const proposal = await proposeAnalysisSection({
    job,
    documents: [],
    knowledge: {summary: {fingerprint: 'bundle-current'}},
    section: 'การวิเคราะห์',
    userId: 'officer-1',
    env,
    fetchImpl: async (_url: unknown, init?: RequestInit) => {
      sent = String(init?.body);
      return response({text: 'วิเคราะห์สำหรับ [[PERSON_1]] เลข [[CASE_1]] [law-1]', citations: ['law-1'], gaps: []});
    },
  });
  assert.equal(sent.includes('สมชาย ใจดี'), false);
  assert.equal(sent.includes('123/68'), false);
  assert.equal(proposal.text, 'วิเคราะห์สำหรับ สมชาย ใจดี เลข 123/68 [law-1]');
  assert.equal(proposal.job_version, 4);
  assert.equal(proposal.provider, 'deepseek');
  assert.equal(proposal.model, 'deepseek-v4-pro');
  assert.deepEqual(proposal.usage, {inputTokens: 20, outputTokens: 10, totalTokens: 30});
  assert.deepEqual(proposal.source_ids, ['law-1', 'fact-fact-1', 'input-claim', 'input-response']);
  assert.equal(proposal.citation_status, 'IDS_VALIDATED_SEMANTIC_REVIEW_REQUIRED');
});

test('analysis proposal refuses a stale knowledge bundle', async () => {
  await assert.rejects(
    proposeAnalysisSection({job: baseJob(), documents: [], knowledge: {summary: {fingerprint: 'bundle-new'}}, section: 'การวิเคราะห์', userId: 'u1', env, fetchImpl: async () => response({})}),
    /ฐานอ้างอิงเปลี่ยน/,
  );
});
