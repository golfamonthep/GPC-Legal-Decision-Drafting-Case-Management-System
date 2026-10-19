import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { storageRead } from './storage.mjs';
import { hash, fail } from './safety.mjs';

const requireModule = createRequire(import.meta.url);
const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[๐-๙]/g, (d) => String(THAI_DIGITS.indexOf(d)))
    .replace(/\s+/g, '')
    .toLowerCase();
}

let cached;

function findLocalKnowledgeRoot() {
  const candidates = [
    process.env.ANALYSIS_KNOWLEDGE_DIR,
    path.resolve(process.cwd(), 'data/police-appointments-2569'),
    'C:\\APP\\data\\police-appointments-2569',
  ].filter(Boolean);
  for (const root of candidates) {
    const manifestPath = path.join(root, 'CURRENT', '1-เนื้อหาหลักและดัชนี', 'SOURCE_BUNDLE_MANIFEST.json');
    const sqlitePath = path.join(root, 'current-database.sqlite3');
    if (existsSync(manifestPath) && existsSync(sqlitePath)) return root;
  }
  return null;
}

function loadLocalKnowledge(root) {
  const bundle = path.join(root, 'CURRENT');
  const dir = path.join(bundle, '1-เนื้อหาหลักและดัชนี');
  const manifest = JSON.parse(readFileSync(path.join(dir, 'SOURCE_BUNDLE_MANIFEST.json'), 'utf8'));
  const rows = manifest.files.map((f) => `${f.file}\0${f.bytes}\0${f.sha256}`).join('\n');
  if (hash(rows) !== manifest.bundle_fingerprint) {
    fail('ฐานอ้างอิงในเครื่องไม่ผ่านการตรวจ fingerprint', 503);
  }
  for (const f of manifest.files) {
    const resolved = path.resolve(bundle, f.file);
    if (!resolved.startsWith(path.resolve(bundle) + path.sep)) fail('เส้นทางไฟล์ฐานอ้างอิงไม่ถูกต้อง', 503);
    const bytes = readFileSync(resolved);
    if (bytes.length !== f.bytes || hash(bytes) !== f.sha256) {
      fail('ฐานอ้างอิงไม่ผ่านการตรวจความครบถ้วน หยุดใช้แหล่งนี้', 503);
    }
  }
  const dbpath = path.join(root, 'current-database.sqlite3');
  if (hash(readFileSync(dbpath)) !== manifest.sqlite_sha256) {
    fail('ฐานข้อมูล SQLite ของฐานอ้างอิงไม่ผ่านการตรวจ hash', 503);
  }
  const { DatabaseSync } = requireModule('node:sqlite');
  const db = new DatabaseSync(dbpath, { readOnly: true });
  const sources = db.prepare('SELECT filename,sha256,page_count,role FROM source_documents').all();
  const appointments = db
    .prepare('SELECT appointment_number,record_json FROM appointments')
    .all()
    .map((x) => ({ id: `appointment-${x.appointment_number}`, ...JSON.parse(x.record_json) }));
  const seniority = db
    .prepare('SELECT workbook_row,record_json FROM seniority_crosswalk')
    .all()
    .map((x) => ({ id: `seniority-${x.workbook_row}`, ...JSON.parse(x.record_json) }));
  const accounts = db
    .prepare('SELECT record_json FROM seniority_accounts')
    .all()
    .map((x) => JSON.parse(x.record_json));
  const mappings = {
    'police-act-2565': 'police_act_2565.pdf',
    'police-appointment-regulation-2567': 'law_rule_2567.pdf',
    'precedent-phithak': 'precedent_phithak.pdf',
    'precedent-wiwat': 'precedent_wiwat.pdf',
  };
  const chunks = [];
  for (const [kind, file, index] of [
    ['law', '01-กฎหมาย.md', '05-ดัชนีค้นหา-กฎหมาย.jsonl'],
    ['precedent', '02-ตัวอย่างคำวินิจฉัย.md', '05-ดัชนีค้นหา-คำวินิจฉัย.jsonl'],
  ]) {
    const canonical = readFileSync(path.join(dir, file), 'utf8');
    const texts = new Map(
      [...canonical.matchAll(/<!-- paragraph_id:\s*([^\s|]+)[^>]*-->\s*([\s\S]*?)(?=\n#{1,6} |<!-- paragraph_id:|$)/g)].map(
        (m) => [m[1], m[2].trim()],
      ),
    );
    for (const line of readFileSync(path.join(dir, index), 'utf8').split(/\r?\n/).filter(Boolean)) {
      const m = JSON.parse(line);
      const text = texts.get(m.paragraph_id);
      if (!text) continue;
      const pdf =
        mappings[m.document_id] ||
        (m.document_id?.includes('phithak')
          ? 'precedent_phithak.pdf'
          : m.document_id?.includes('wiwat')
            ? 'precedent_wiwat.pdf'
            : null);
      if (!pdf || !sources.find((s) => s.filename === pdf)) continue;
      chunks.push({
        id: m.paragraph_id,
        kind,
        label: m.label || m.paragraph_id,
        document_id: m.document_id,
        source_pdf: pdf,
        page: m.page_start,
        text,
        role: kind === 'precedent' ? 'reference_only' : 'law',
        status: 'INHERITED_OLD_BUNDLE_NOT_REVERIFIED',
      });
    }
  }
  const records = [
    ...chunks,
    ...seniority.map((s) => ({
      ...s,
      kind: 'seniority',
      page: s.source_pdf_page,
      text: JSON.stringify(s),
      status: s.verification_status,
      label: s.source_name,
    })),
    ...appointments.map((a) => ({
      ...a,
      kind: 'appointment',
      page: a['หน้า PDF'],
      text: JSON.stringify(a),
      status: a.appointment_verification_status,
      label: a['ชื่อ–นามสกุล'] || a['ชื่อ-นามสกุล'] || Object.values(a)[5],
    })),
  ];
  const summary = {
    version: manifest.version,
    fingerprint: manifest.bundle_fingerprint,
    integrity: 'VERIFIED',
    sources,
    appointments: appointments.length,
    seniority: seniority.length,
    accounts,
    chunk_count: chunks.length,
    exclusive_seniority_source: manifest.exclusive_seniority_source,
  };
  const all = new Map(records.map((r) => [r.id, r]));
  return {
    format: 'gpc-analysis-knowledge-v1',
    summary,
    records,
    chunks,
    seniority,
    appointments,
    accounts,
    all,
    search(q, kind) {
      const query = normalizeSearchText(q);
      return records
        .filter(
          (r) =>
            (!kind || r.kind === kind) &&
            (query ? normalizeSearchText((r.label || '') + (r.text || '')).includes(query) : r.kind === 'law'),
        )
        .slice(0, 60);
    },
    async source(name) {
      const s = summary.sources.find((x) => x.filename === name);
      if (!s) fail('ไม่พบต้นฉบับ', 404);
      const raw = db.prepare('SELECT raw_pdf FROM source_documents WHERE filename=?').get(name)?.raw_pdf;
      if (!raw) fail('ไม่พบต้นฉบับ', 404);
      const buf = Buffer.from(raw);
      if (hash(buf) !== s.sha256) fail('ต้นฉบับไม่ผ่านการตรวจ hash', 503);
      return buf;
    },
  };
}

export async function knowledge() {
  const key = process.env.ANALYSIS_KNOWLEDGE_OBJECT;
  const expected = process.env.ANALYSIS_KNOWLEDGE_SHA256;
  if (!key && !expected) {
    const localRoot = findLocalKnowledgeRoot();
    if (localRoot) {
      if (cached?.key === `local:${localRoot}`) return cached.value;
      const value = loadLocalKnowledge(localRoot);
      cached = { key: `local:${localRoot}`, hash: value.summary.fingerprint, value };
      return value;
    }
  }
  if (!key || !expected || !/^[a-f0-9]{64}$/.test(expected)) {
    fail('ฐานอ้างอิงส่วนวิเคราะห์ยังไม่ได้ย้ายเข้าพื้นที่ส่วนตัวบนเว็บ', 503);
  }
  if (cached?.key === key && cached?.hash === expected) return cached.value;
  const bytes = await storageRead(key);
  if (bytes.length > 30 * 1024 * 1024 || hash(bytes) !== expected) {
    fail('ฐานอ้างอิงไม่ผ่านการตรวจความครบถ้วน หยุดใช้แหล่งนี้', 503);
  }
  const p = JSON.parse(bytes.toString('utf8'));
  if (
    p.format !== 'gpc-analysis-knowledge-v1' ||
    p.summary.integrity !== 'VERIFIED' ||
    !Array.isArray(p.records) ||
    !Array.isArray(p.seniority) ||
    !Array.isArray(p.accounts)
  ) {
    fail('รูปแบบฐานอ้างอิงไม่ถูกต้อง', 503);
  }
  const all = new Map(p.records.map((r) => [r.id, r]));
  const value = {
    ...p,
    all,
    search(q, kind) {
      const text = normalizeSearchText(q);
      return p.records
        .filter(
          (r) =>
            (!kind || r.kind === kind) &&
            (text ? normalizeSearchText((r.label || '') + (r.text || '')).includes(text) : r.kind === 'law'),
        )
        .slice(0, 60);
    },
    async source(name) {
      const s = p.summary.sources.find((x) => x.filename === name);
      if (!s || !s.object_key) fail('ไม่พบต้นฉบับ', 404);
      const result = await storageRead(s.object_key);
      if (hash(result) !== s.sha256) fail('ต้นฉบับไม่ผ่านการตรวจ hash', 503);
      return result;
    },
  };
  cached = { key, hash: expected, value };
  return value;
}

export const missingKnowledge = {
  version: null,
  fingerprint: null,
  integrity: 'UNAVAILABLE',
  sources: [],
  appointments: null,
  seniority: null,
  accounts: [],
  chunk_count: null,
  exclusive_seniority_source: null,
};

