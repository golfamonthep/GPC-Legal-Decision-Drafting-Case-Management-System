import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const sha = x => createHash('sha256').update(x).digest('hex');
export const normalizeName = x => String(x || '').normalize('NFC').replace(/^(พล\.?\s*ต\.?\s*อ\.?|พล\.?\s*ต\.?\s*ท\.?|พล\.?\s*ต\.?\s*ต\.?|พ\.?\s*ต\.?\s*อ\.?|พลตำรวจเอก|พลตำรวจโท|พลตำรวจตรี|พันตำรวจเอก)\s*/, '').replace(/\s+/g, '');
export function loadKnowledge(root) {
  const bundle = path.join(root, 'CURRENT');
  const dir = path.join(bundle, '1-เนื้อหาหลักและดัชนี');
  const manifest = JSON.parse(readFileSync(path.join(dir, 'SOURCE_BUNDLE_MANIFEST.json'), 'utf8'));
  const problems = [];
  // The Windows generator stores its sorted Path order in the manifest.
  const rows=manifest.files.map(f=>`${f.file}\0${f.bytes}\0${f.sha256}`).join('\n');
  if(sha(rows)!==manifest.bundle_fingerprint)problems.push('bundle_fingerprint');
  for (const f of manifest.files) {
    const resolved = path.resolve(bundle, f.file);
    if (!resolved.startsWith(path.resolve(bundle) + path.sep)) throw new Error('Invalid bundle path');
    const bytes = readFileSync(resolved);
    if (bytes.length !== f.bytes || sha(bytes) !== f.sha256) problems.push(f.file);
  }
  const dbpath = path.join(root, 'current-database.sqlite3');
  if (sha(readFileSync(dbpath)) !== manifest.sqlite_sha256) problems.push('current-database.sqlite3');
  if (problems.length) throw new Error('SOURCE_BUNDLE_INTEGRITY_FAILED: ' + problems.join(', '));
  const db = new DatabaseSync(dbpath, { readOnly: true });
  const sources = db.prepare('SELECT filename,sha256,page_count,role FROM source_documents').all();
  const appointments = db.prepare('SELECT appointment_number,record_json FROM appointments').all().map(x=>({id:`appointment-${x.appointment_number}`, ...JSON.parse(x.record_json)}));
  const seniority = db.prepare('SELECT workbook_row,record_json FROM seniority_crosswalk').all().map(x=>({id:`seniority-${x.workbook_row}`, ...JSON.parse(x.record_json)}));
  const accounts = db.prepare('SELECT record_json FROM seniority_accounts').all().map(x=>JSON.parse(x.record_json));
  const mappings = { 'police-act-2565':'police_act_2565.pdf', 'police-appointment-regulation-2567':'law_rule_2567.pdf', 'precedent-phithak':'precedent_phithak.pdf', 'precedent-wiwat':'precedent_wiwat.pdf' };
  const chunks = [];
  for (const [kind,file,index] of [['law','01-กฎหมาย.md','05-ดัชนีค้นหา-กฎหมาย.jsonl'],['precedent','02-ตัวอย่างคำวินิจฉัย.md','05-ดัชนีค้นหา-คำวินิจฉัย.jsonl']]) {
    const canonical = readFileSync(path.join(dir,file),'utf8');
    const texts = new Map([...canonical.matchAll(/<!-- paragraph_id:\s*([^\s|]+)[^>]*-->\s*([\s\S]*?)(?=\n#{1,6} |<!-- paragraph_id:|$)/g)].map(m=>[m[1],m[2].trim()]));
    for (const line of readFileSync(path.join(dir,index),'utf8').split(/\r?\n/).filter(Boolean)) {
      const m = JSON.parse(line); const text = texts.get(m.paragraph_id);
      if (!text) continue;
      const pdf = mappings[m.document_id] || (m.document_id?.includes('phithak')?'precedent_phithak.pdf':m.document_id?.includes('wiwat')?'precedent_wiwat.pdf':null);
      if (!pdf || !sources.find(s=>s.filename===pdf)) continue;
      chunks.push({id:m.paragraph_id,kind,label:m.label || m.paragraph_id,document_id:m.document_id,source_pdf:pdf,page:m.page_start,text,role:kind==='precedent'?'reference_only':'law',status:'INHERITED_OLD_BUNDLE_NOT_REVERIFIED'});
    }
  }
  const summary = {version:manifest.version,fingerprint:manifest.bundle_fingerprint,integrity:'VERIFIED',sources,appointments:appointments.length,seniority:seniority.length,accounts,chunk_count:chunks.length,exclusive_seniority_source:manifest.exclusive_seniority_source};
  const all = new Map([...chunks,...seniority.map(s=>({...s,kind:'seniority',page:s.source_pdf_page,text:JSON.stringify(s),status:s.verification_status,label:s.source_name})),...appointments.map(a=>({...a,kind:'appointment',page:a['หน้า PDF'],text:JSON.stringify(a),status:a.appointment_verification_status,label:a['ชื่อ–นามสกุล']||a['ชื่อ-นามสกุล']||Object.values(a)[5]}))].map(c=>[c.id,c]));
  return {db,summary,all,chunks,seniority,appointments,accounts,source(filename){return db.prepare('SELECT raw_pdf FROM source_documents WHERE filename=?').get(filename)?.raw_pdf;},search(q,kind){const query=String(q||'').replace(/\s+/g,'').toLowerCase();return [...all.values()].filter(c=>(!kind||c.kind===kind)&& (query ? (c.label+c.text).replace(/\s+/g,'').toLowerCase().includes(query):c.kind==='law')).slice(0,60);}};
}
