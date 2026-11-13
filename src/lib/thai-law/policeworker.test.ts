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

  const circular2456 = items.find((i: any) => i.id === 'police-circular-2456-2569');
  assert.ok(circular2456, 'Must contain หนังสือเวียน ตร. ว 2456 (แต่งตั้ง รอง ผบก. - สว. 2569)');
  assert.equal(circular2456.year, 2569);
  assert.equal(circular2456.isNew, true);
});

test('OCR python processor script and OpenThai 2.0 OCR models (Text & Markdown) are installed', async () => {
  const ocrScript = path.resolve(process.cwd(), 'scripts/ocr_processor.py');
  assert.ok(fs.existsSync(ocrScript), 'scripts/ocr_processor.py must exist');

  const scriptSource = fs.readFileSync(ocrScript, 'utf8');
  assert.ok(scriptSource.includes('iapp/OpenThai2.0-OCR-Text'), 'Must support iapp/OpenThai2.0-OCR-Text');
  assert.ok(scriptSource.includes('iapp/OpenThai2.0-OCR-Markdown'), 'Must support iapp/OpenThai2.0-OCR-Markdown');

  const detOnnx = path.resolve(process.cwd(), 'tools/openthai2-ocr-text/det.onnx');
  const recOnnx = path.resolve(process.cwd(), 'tools/openthai2-ocr-text/rec.onnx');
  const lineEngine = path.resolve(process.cwd(), 'tools/openthai2-ocr-text/runtime/line_engine.py');
  assert.ok(fs.existsSync(detOnnx), 'OpenThai2.0-OCR-Text det.onnx must exist');
  assert.ok(fs.existsSync(recOnnx), 'OpenThai2.0-OCR-Text rec.onnx must exist');
  assert.ok(fs.existsSync(lineEngine), 'OpenThai2.0-OCR-Text runtime/line_engine.py must exist');

  const presetsPath = path.resolve(process.cwd(), 'src/data/thai-law/openthai-ocr-presets.json');
  assert.ok(fs.existsSync(presetsPath), 'openthai-ocr-presets.json must exist');
  const presets = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
  const circularPages = presets['scratch/policeworker/circular_2456_2569.pdf'];
  assert.ok(circularPages && circularPages['1'], 'Must have pre-extracted page 1 of Circular 2456');
  assert.ok(circularPages['1'].text.includes('บันทึกข้อความ'), 'OCR text must include บันทึกข้อความ');
  assert.ok(circularPages['1'].markdown.includes('# บันทึกข้อความ'), 'OCR markdown must include # บันทึกข้อความ');
});
