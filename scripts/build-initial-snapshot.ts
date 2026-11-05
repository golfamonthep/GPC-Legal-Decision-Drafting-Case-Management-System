import fs from 'node:fs';
import path from 'node:path';
import { parseRegistryWorkbook } from '../src/lib/registry/parseRegistryFile';
import { upsertRowsToSnapshot, loadCasesSnapshot } from '../src/lib/registry/caseSnapshot';

const complaintFile = 'c:/Users/polic/OneDrive/04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์/ทะเบียนคุม ร้องทุกข์ 1-106.xlsm';
const appealFile = 'c:/Users/polic/OneDrive/04 ทะเบียนคุม ร้องทุกข์-อุทธรณ์/ทะเบียนคุม อุทธรณ์ 1-109.xlsm';

console.log('[Snapshot Builder] Reading files...');

if (!fs.existsSync(complaintFile)) {
  console.error('File not found:', complaintFile);
  process.exit(1);
}
if (!fs.existsSync(appealFile)) {
  console.error('File not found:', appealFile);
  process.exit(1);
}

// 1. Process complaints
const buf1 = fs.readFileSync(complaintFile);
const res1 = parseRegistryWorkbook(buf1, path.basename(complaintFile));
console.log(`[Complaints] Parsed ${res1.totalRows} cases`);
const up1 = upsertRowsToSnapshot(res1.rows, 'ร้องทุกข์');
console.log(`[Complaints] Upserted: Updated ${up1.updatedCount}, Inserted ${up1.insertedCount}`);

// 2. Process appeals
const buf2 = fs.readFileSync(appealFile);
const res2 = parseRegistryWorkbook(buf2, path.basename(appealFile));
console.log(`[Appeals] Parsed ${res2.totalRows} cases`);
const up2 = upsertRowsToSnapshot(res2.rows, 'อุทธรณ์');
console.log(`[Appeals] Upserted: Updated ${up2.updatedCount}, Inserted ${up2.insertedCount}`);

// 3. Final summary
const finalData = loadCasesSnapshot();
console.log('\n========================================');
console.log('✅ Cases Snapshot Created Successfully!');
console.log('========================================');
console.log('Summary:', JSON.stringify(finalData.summary, null, 2));
console.log('File:', path.resolve(process.cwd(), 'src/data/cases-snapshot.json'));
console.log(`Total records in JSON: ${finalData.cases.length}`);
