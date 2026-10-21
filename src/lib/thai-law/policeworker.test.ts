import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PoliceWorker regulations dataset loads and contains priority 2569-2570 regulations', async () => {
  const filePath = path.resolve(process.cwd(), 'src/data/thai-law/policeworker-regulations.json');
  assert.ok(fs.existsSync(filePath), 'policeworker-regulations.json must exist');

  const raw = fs.readFileSync(filePath, 'utf8');
  const items = JSON.parse(raw);

  assert.ok(Array.isArray(items), 'Must be an array of regulations');
  assert.ok(items.length >= 400, `Expected at least 400 regulations, got ${items.length}`);

  // Test priority items
  const discipline2569 = items.find((i: any) => i.id === 'discipline-regulation-2569');
  assert.ok(discipline2569, 'Must contain กฎ ก.ตร. วินัย 2569');
  assert.equal(discipline2569.year, 2569);
  assert.equal(discipline2569.isNew, true);
  assert.ok(discipline2569.sourceUrl.includes('drive.google.com/file/d/19LZd1pbMTrF5nOZAtmjcqv-mQH_n5AR6'));

  const order424 = items.find((i: any) => i.id === 'police-order-424-2569');
  assert.ok(order424, 'Must contain คำสั่ง ตร. ที่ 424/2569');
  assert.equal(order424.year, 2569);
  assert.equal(order424.isNew, true);

  const policy2570 = items.find((i: any) => i.id === 'police-policy-2570');
  assert.ok(policy2570, 'Must contain นโยบาย ผบ.ตร. 2570');
  assert.equal(policy2570.year, 2570);
  assert.equal(policy2570.isNew, true);

  const gpcRemuneration = items.find((i: any) => i.id === 'royal-decree-gpc-remuneration-2567');
  assert.ok(gpcRemuneration, 'Must contain พ.ร.ฎ.เงินประจำตำแหน่ง ก.พ.ค.ตร. 2567');
  assert.equal(gpcRemuneration.category, 'ก.พ.ค.ตร. และการพิทักษ์ระบบคุณธรรม');
});

test('OCR python processor script exists and is executable', async () => {
  const ocrScript = path.resolve(process.cwd(), 'scripts/ocr_processor.py');
  assert.ok(fs.existsSync(ocrScript), 'scripts/ocr_processor.py must exist');
});
