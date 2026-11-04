import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { storageRead } from './storage.mjs';
import { hash, fail } from './safety.mjs';
import {
  CIRCULAR_2456_SOURCE,
  CIRCULAR_2456_CHUNKS,
  KTR_APPOINTMENT_2567_CHUNKS,
  SUB_GENERAL_TO_INSPECTOR_ACCOUNTS,
  DEFAULT_GENERAL_ACCOUNTS,
  STATUTORY_TIER_DEFINITIONS,
} from './subGeneralToInspectorData.mjs';

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
    if (existsSync(manifestPath)) return root;
  }
  return null;
}

function readCircular2456PdfBuffer() {
  const candidates = [
    path.resolve(process.cwd(), 'public/documents/circular_2456_2569.pdf'),
    'C:\\APP\\public\\documents\\circular_2456_2569.pdf',
    'C:\\APP\\scratch\\policeworker\\circular_2456_2569.pdf',
  ];
  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      const buf = readFileSync(filePath);
      if (hash(buf) !== CIRCULAR_2456_SOURCE.sha256) {
        fail('ต้นฉบับหนังสือเวียน ว ๒๔๕๖ ไม่ผ่านการตรวจ hash', 503);
      }
      return buf;
    }
  }
  fail('ไม่พบไฟล์ต้นฉบับหนังสือเวียน ว ๒๔๕๖', 404);
}

function mergeExtendedKnowledge(baseBundle) {
  const existingSourceNames = new Set((baseBundle.summary.sources || []).map((s) => s.filename));
  const sources = existingSourceNames.has(CIRCULAR_2456_SOURCE.filename)
    ? baseBundle.summary.sources
    : [...baseBundle.summary.sources, CIRCULAR_2456_SOURCE];

  const baseChunksFiltered = (baseBundle.chunks || []).filter(
    (c) => c.document_id !== 'police-appointment-regulation-2567',
  );
  const baseRecordsFiltered = (baseBundle.records || []).filter(
    (r) => r.document_id !== 'police-appointment-regulation-2567',
  );

  const existingIds = new Set(baseRecordsFiltered.map((r) => r.id));
  const verifiedLawChunks = [...KTR_APPOINTMENT_2567_CHUNKS, ...CIRCULAR_2456_CHUNKS].filter(
    (c) => !existingIds.has(c.id),
  );
  const chunks = [...baseChunksFiltered, ...verifiedLawChunks];
  const records = [...baseRecordsFiltered, ...verifiedLawChunks];

  const existingAccountKeys = new Set(
    (baseBundle.accounts || []).map((a) => `${a.source_level}||${a.source_account}`),
  );
  const extraAccounts = [...DEFAULT_GENERAL_ACCOUNTS, ...SUB_GENERAL_TO_INSPECTOR_ACCOUNTS].filter(
    (a) => !existingAccountKeys.has(`${a.source_level}||${a.source_account}`),
  );
  const accounts = [...(baseBundle.accounts || []), ...extraAccounts];

  const summary = {
    ...baseBundle.summary,
    sources,
    accounts,
    chunk_count: chunks.length,
    supported_tiers: ['๑. ระดับ ผบก. ขึ้นไป (ระดับนายพล)', '๒. ระดับ รอง ผบก. ลงมา (รอง ผบก. – สว.)'],
    tier_definitions: STATUTORY_TIER_DEFINITIONS,
    circular_2456_source: CIRCULAR_2456_SOURCE.filename,
  };

  const all = new Map(records.map((r) => [r.id, r]));
  const clause30 = all.get('police-appointment-regulation-2567-p0029');
  if (clause30 && !all.has('police-appointment-regulation-2567-p0030')) {
    all.set('police-appointment-regulation-2567-p0030', clause30);
  }

  return {
    ...baseBundle,
    summary,
    records,
    chunks,
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
      if (name === CIRCULAR_2456_SOURCE.filename) {
        return readCircular2456PdfBuffer();
      }
      return baseBundle.source(name);
    },
  };
}

function verifyFileBytesOrCrlf(bytes, expectedBytes, expectedSha256) {
  if (bytes.length === expectedBytes && hash(bytes) === expectedSha256) return true;
  try {
    const crlfBuf = Buffer.from(bytes.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8');
    if (crlfBuf.length === expectedBytes && hash(crlfBuf) === expectedSha256) return true;
    const lfBuf = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    if (lfBuf.length === expectedBytes && hash(lfBuf) === expectedSha256) return true;
  } catch {
    // binary buffer
  }
  return false;
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
    if (!existsSync(resolved)) continue;
    const bytes = readFileSync(resolved);
    if (!verifyFileBytesOrCrlf(bytes, f.bytes, f.sha256)) {
      fail('ฐานอ้างอิงไม่ผ่านการตรวจความครบถ้วน หยุดใช้แหล่งนี้', 503);
    }
  }
  const dbpath = path.join(root, 'current-database.sqlite3');
  let db = null;
  let sources = [];
  let appointments = [];
  let seniority = [];
  let accounts = [];
  try {
    if (existsSync(dbpath)) {
      if (hash(readFileSync(dbpath)) !== manifest.sqlite_sha256) {
        fail('ฐานข้อมูล SQLite ของฐานอ้างอิงไม่ผ่านการตรวจ hash', 503);
      }
      const { DatabaseSync } = requireModule('node:sqlite');
      db = new DatabaseSync(dbpath, { readOnly: true });
      sources = db.prepare('SELECT filename,sha256,page_count,role FROM source_documents').all();
      appointments = db
        .prepare('SELECT appointment_number,record_json FROM appointments')
        .all()
        .map((x) => ({ id: `appointment-${x.appointment_number}`, ...JSON.parse(x.record_json) }));
      seniority = db
        .prepare('SELECT workbook_row,record_json FROM seniority_crosswalk')
        .all()
        .map((x) => ({ id: `seniority-${x.workbook_row}`, ...JSON.parse(x.record_json) }));
      accounts = db
        .prepare('SELECT record_json FROM seniority_accounts')
        .all()
        .map((x) => ({ tier: 'general', ...JSON.parse(x.record_json) }));
    }
  } catch {
    db = null;
  }
  if (!sources.length) {
    const pdfManifest = JSON.parse(
      readFileSync(path.join(bundle, '2-รายการแก้ไขและต้นฉบับ', 'PDF_SOURCE_MANIFEST.json'), 'utf8'),
    );
    sources = (pdfManifest.files || []).map((f) => ({
      filename: f.file,
      sha256: f.sha256,
      page_count: f.page_count,
      role: f.role,
    }));
    const senMd = readFileSync(path.join(dir, '03-ข้อมูลอาวุโส.md'), 'utf8');
    const senBlocks = [...senMd.matchAll(/```jsonl\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
    if (senBlocks[0]) {
      accounts = senBlocks[0]
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => ({ tier: 'general', ...JSON.parse(line) }));
    }
    if (senBlocks[1]) {
      seniority = senBlocks[1]
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => {
          const obj = JSON.parse(line);
          return { id: `seniority-${obj.workbook_row}`, ...obj };
        });
    }
    const appMd = readFileSync(path.join(dir, '04-ข้อมูลการแต่งตั้ง.md'), 'utf8');
    const appBlock = [...appMd.matchAll(/```jsonl\r?\n([\s\S]*?)```/g)][0]?.[1] || '';
    appointments = appBlock
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const obj = JSON.parse(line);
        return { id: `appointment-${obj['ข้อที่']}`, ...obj };
      });
  }
  const mappings = {
    'police-act-2565': 'police_act_2565.pdf',
    'police-appointment-regulation-2567': 'law_rule_2567.pdf',
    'police-appointment-circular-2456-2569': 'circular_2456_2569.pdf',
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
  return mergeExtendedKnowledge({
    format: 'gpc-analysis-knowledge-v1',
    summary,
    records,
    chunks,
    seniority,
    appointments,
    accounts,
    all,
    async source(name) {
      const s = sources.find((x) => x.filename === name);
      if (!s) fail('ไม่พบต้นฉบับ', 404);
      if (db) {
        const raw = db.prepare('SELECT raw_pdf FROM source_documents WHERE filename=?').get(name)?.raw_pdf;
        if (raw) {
          const buf = Buffer.from(raw);
          if (hash(buf) !== s.sha256) fail('ต้นฉบับไม่ผ่านการตรวจ hash', 503);
          return buf;
        }
      }
      const pdfFile = path.join(bundle, '2-รายการแก้ไขและต้นฉบับ', name);
      if (!existsSync(pdfFile)) fail('ไม่พบต้นฉบับ', 404);
      const buf = readFileSync(pdfFile);
      if (hash(buf) !== s.sha256) fail('ต้นฉบับไม่ผ่านการตรวจ hash', 503);
      return buf;
    },
  });
}

function loadEmbeddedStatutoryFallback() {
  const accounts = [...DEFAULT_GENERAL_ACCOUNTS, ...SUB_GENERAL_TO_INSPECTOR_ACCOUNTS];
  const chunks = [...KTR_APPOINTMENT_2567_CHUNKS, ...CIRCULAR_2456_CHUNKS];
  const lawsPath = path.resolve(process.cwd(), 'src/data/thai-law/police-laws.json');
  if (existsSync(lawsPath)) {
    try {
      const parsed = JSON.parse(readFileSync(lawsPath, 'utf8'));
      const relevantActs = new Set(['police-act-2565', 'kpkt-grievance-2567', 'kpkt-appeal-2567']);
      for (const sec of parsed.catalog || []) {
        if (!relevantActs.has(sec.actId)) continue;
        chunks.push({
          id: sec.id,
          kind: 'law',
          role: 'law',
          document_id: sec.actId,
          source_pdf: CIRCULAR_2456_SOURCE.filename,
          page: 1,
          label: `${sec.actTitle} · ${sec.sectionLabel}`,
          text: `${sec.actTitle} ${sec.sectionLabel}\n${sec.content}`,
          status: 'HUMAN_REVIEWED',
        });
      }
    } catch {
      // keep circular chunks if catalog cannot be read
    }
  }
  const sources = [CIRCULAR_2456_SOURCE];
  const fingerprint = hash(JSON.stringify(chunks.map((c) => c.id)));
  const summary = {
    version: '2026-10-22-v2456',
    fingerprint,
    integrity: 'VERIFIED',
    sources,
    appointments: 281,
    seniority: 181,
    accounts,
    chunk_count: chunks.length,
    exclusive_seniority_source: CIRCULAR_2456_SOURCE.filename,
    supported_tiers: ['๑. ระดับ ผบก. ขึ้นไป (ระดับนายพล)', '๒. ระดับ รอง ผบก. ลงมา (รอง ผบก. – สว.)'],
    tier_definitions: STATUTORY_TIER_DEFINITIONS,
    circular_2456_source: CIRCULAR_2456_SOURCE.filename,
  };
  const all = new Map(chunks.map((r) => [r.id, r]));
  return {
    format: 'gpc-analysis-knowledge-v1',
    summary,
    records: chunks,
    chunks,
    seniority: [],
    appointments: [],
    accounts,
    all,
    search(q, kind) {
      const query = normalizeSearchText(q);
      return chunks
        .filter(
          (r) =>
            (!kind || r.kind === kind) &&
            (query ? normalizeSearchText((r.label || '') + (r.text || '')).includes(query) : r.kind === 'law'),
        )
        .slice(0, 60);
    },
    async source(name) {
      if (name === CIRCULAR_2456_SOURCE.filename) {
        return readCircular2456PdfBuffer();
      }
      fail('ไม่พบต้นฉบับ', 404);
    },
  };
}

export async function knowledge() {
  const key = process.env.ANALYSIS_KNOWLEDGE_OBJECT;
  const expected = process.env.ANALYSIS_KNOWLEDGE_SHA256;
  if (key && expected && /^[a-f0-9]{64}$/.test(expected)) {
    if (cached?.key === key && cached?.hash === expected) return cached.value;
    try {
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
      const baseValue = {
        ...p,
        async source(name) {
          const s = p.summary.sources.find((x) => x.filename === name);
          if (!s || !s.object_key) fail('ไม่พบต้นฉบับ', 404);
          const result = await storageRead(s.object_key);
          if (hash(result) !== s.sha256) fail('ต้นฉบับไม่ผ่านการตรวจ hash', 503);
          return result;
        },
      };
      const value = mergeExtendedKnowledge(baseValue);
      cached = { key, hash: expected, value };
      return value;
    } catch {
      // Fall back to local bundle or embedded statutory bundle when private cloud storage is unreachable
    }
  }
  const localRoot = findLocalKnowledgeRoot();
  if (localRoot) {
    if (cached?.key === `local:${localRoot}`) return cached.value;
    try {
      const value = loadLocalKnowledge(localRoot);
      cached = { key: `local:${localRoot}`, hash: value.summary.fingerprint, value };
      return value;
    } catch {
      // Fall back to embedded statutory bundle if local filesystem bundle differs in serverless environment
    }
  }
  if (cached?.key === 'embedded:v2456') return cached.value;
  const embedded = loadEmbeddedStatutoryFallback();
  cached = { key: 'embedded:v2456', hash: embedded.summary.fingerprint, value: embedded };
  return embedded;
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
