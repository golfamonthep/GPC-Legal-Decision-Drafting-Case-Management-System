// Offline, non-mutating reconciliation. Private input/output stays outside Git.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseThaiDate } from '../src/lib/dateUtils.ts';
const dir = path.resolve('private-test-data/registry-20261012');
const backupPath = path.resolve('private-test-data/database-backup-20261012/gpc-schema-data.csv');
const csv = (await fs.readFile(backupPath, 'utf8')).replace(/^\uFEFF/, '');
const newline = csv.indexOf('\n');
if (csv.slice(0, newline).trim() !== 'backup') throw Error('Unexpected backup format');
let encoded = csv.slice(newline + 1).trim();
if (encoded.startsWith('"') && encoded.endsWith('"')) encoded = encoded.slice(1, -1).replace(/""/g, '"');
const backup = JSON.parse(encoded);
if (backup.project_id !== 'tlqszhlggvoirhalsxge' || backup.tables.length !== 32 || backup.tables.some(t => t.count !== t.data.length)) throw Error('Incomplete backup');
const cases = backup.tables.find(t => t.name === 'Case').data;
const normalize = value => String(value ?? '').replace(/[๐-๙]/g, d => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d))).replace(/\s+/g, '');
const key = (type, black) => type + '::' + normalize(black);
const previous = new Map(cases.map(c => [key(c.type, c.blackNumber), c]));
const candidates = [], errors = [], warnings = [], counts = {};
for (const kind of ['complaint', 'appeal']) {
  const source = JSON.parse(await fs.readFile(path.join(dir, kind + '-source.json'), 'utf8'));
  const type = kind === 'complaint' ? 'ร้องทุกข์' : 'อุทธรณ์';
  const seen = new Set();
  counts[kind] = { total: 0, added: 0, existing: 0, redCompleted: 0 };
  for (const r of source.records) {
    const c = r.cells, blackNumber = normalize(c.B), k = key(type, blackNumber);
    if (seen.has(k)) { errors.push({ kind, row:r.row, code:'DUPLICATE_BLACK' }); continue; }
    seen.add(k);
    const old = previous.get(k), rawRed = String(c.C ?? '').trim();
    const redMatch = normalize(rawRed).match(/\d+\/\d+/);
    const redNumber = redMatch?.[0] ?? null;
    const item = { type, blackNumber, registryRedText:rawRed || null, redNumber,
      currentStatus:rawRed ? 'เสร็จสิ้น' : String(c.W ?? old?.currentStatus ?? 'อยู่ระหว่างดำเนินการ').trim() || 'อยู่ระหว่างดำเนินการ',
      petitionerName:String(c.D ?? old?.petitionerName ?? 'ไม่ระบุ').trim(),
      respondentName:String(c.F ?? old?.respondentName ?? 'ไม่ระบุ').trim(),
      subject:String(c.E ?? old?.subject ?? 'ไม่ระบุ').trim(),
      legalCategory:old?.legalCategory ?? (kind === 'complaint' ? 'ร้องทุกข์' : 'อุทธรณ์คำสั่ง'),
      legalOfficerName:String(c[kind === 'complaint' ? 'P' : 'Q'] ?? old?.legalOfficerName ?? '').trim() || null,
      oneDriveUrl:String(c[kind === 'complaint' ? 'Q' : 'R'] ?? old?.oneDriveUrl ?? '').trim() || null,
      proceedingNote:String(c.K ?? old?.proceedingNote ?? '').trim() || null,
      expectedId:old?.id ?? null, expectedUpdatedAt:old?.updatedAt ?? null,
      source:{filename:source.filename, sheet:source.sheet, sha256:source.sha256, row:r.row, cells:c} };
    const dateColumns = kind === 'complaint' ? {receivedDate:'H',dueDate30:'M',dueDate90:'N',dueDate120:'O',meetingDate:'S'} : {receivedDate:'H',dueDate120:'M',dueDate240:'P'};
    for (const [field, col] of Object.entries(dateColumns)) {
      const value = c[col], parsed = parseThaiDate(value);
      item[field] = parsed ? parsed.toISOString() : old?.[field] ?? null;
      if (value != null && String(value).trim() && !parsed) warnings.push({kind,row:r.row,column:col,code:'INVALID_DATE_PRESERVED'});
    }
    if(kind === 'appeal') {
      const parsed = ['N','O'].map(col => parseThaiDate(c[col])).filter(Boolean).sort((a,b)=>a-b);
      item.dueDate60 = parsed[0]?.toISOString() ?? old?.dueDate60 ?? null;
      if(parsed.length === 2 && +parsed[0] !== +parsed[1]) warnings.push({kind,row:r.row,column:'N/O',code:'TWO_DEADLINES_USE_EARLIEST'});
    }
    candidates.push(item); counts[kind].total++; counts[kind][old ? 'existing' : 'added']++; if(rawRed) counts[kind].redCompleted++;
  }
}
const redOwners = new Map();
for(const c of candidates) {
  if(!c.redNumber) continue;
  const redKey=key(c.type,c.redNumber), owner=redOwners.get(redKey);
  if(owner && owner !== c.blackNumber) errors.push({type:c.type,blackNumber:c.blackNumber,code:'DUPLICATE_RED'});
  redOwners.set(redKey,c.blackNumber);
  const conflicting=cases.find(old=>old.type===c.type&&normalize(old.redNumber)===c.redNumber&&normalize(old.blackNumber)!==c.blackNumber);
  if(conflicting) errors.push({type:c.type,blackNumber:c.blackNumber,code:'RED_OWNED_BY_OTHER_CASE'});
}
const report={ projectId:backup.project_id, backupSha256:createHash('sha256').update(csv).digest('hex'), counts, errors, warningCount:warnings.length, warnings, missingFromFiles:cases.filter(c=>!candidates.some(i=>key(i.type,i.blackNumber)===key(c.type,c.blackNumber))).map(c=>({id:c.id,type:c.type,blackNumber:c.blackNumber})), mutationsExecuted:false };
await fs.writeFile(path.join(dir,'dry-run.json'),JSON.stringify(report,null,2));
await fs.writeFile(path.join(dir,'candidates.json'),JSON.stringify(candidates));
console.log(JSON.stringify({counts,errors,warningCount:warnings.length,missingFromFiles:report.missingFromFiles.length,mutationsExecuted:false}));
if(errors.length) process.exitCode=1;
