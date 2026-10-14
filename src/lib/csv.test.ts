import assert from 'node:assert/strict';
import test from 'node:test';
const modulePromise = import('./csv').catch(() => null);
test('CSV quotes legal text and neutralizes formula-leading notes and names for Excel', async () => {
  const subject = await modulePromise;
  assert.ok(subject, 'spreadsheet-safe serializer must exist');
  assert.equal(subject.csvCell('ข้อความ "ทดสอบ", ต่อไป\nอีกบรรทัด'), '"ข้อความ ""ทดสอบ"", ต่อไป\nอีกบรรทัด"');
  assert.equal(subject.csvCell('=HYPERLINK("https://example.test","เปิด")'), '"\'=HYPERLINK(""https://example.test"",""เปิด"")"');
  assert.equal(subject.csvCell(' \t+SUM(1,2)'), '"\' \t+SUM(1,2)"');
  assert.equal(subject.csvCell(12), '"12"');
});
