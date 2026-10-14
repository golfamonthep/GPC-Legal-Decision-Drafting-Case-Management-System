import assert from 'node:assert/strict';
import test from 'node:test';

// Deliberately red until the real validator/service is introduced.
const modulePromise = import('./caseEditor').catch(() => null);
const fixture = { type: 'อุทธรณ์', blackNumber: '123/68', petitionerName: 'ผู้ทดสอบ', respondentName: 'คู่กรณีทดสอบ', subject: 'เรื่องทดสอบ', registryRedText: '', currentStatus: 'รอคำชี้แจง', proceedingNote: 'รอคำตอบ' };
test('manual records require identity and a valid registry, and do not invent red numbers', async () => {
  const subject = await modulePromise;
  assert.ok(subject, 'case editor validation must exist');
  const record = subject.validateCaseRecord({ ...fixture, registryRedText: ' แดงแล้ว ' });
  assert.equal(record.registryRedText, 'แดงแล้ว');
  assert.equal(record.redNumber, null);
  assert.equal(record.currentStatus, 'เสร็จสิ้น');
  assert.throws(() => subject.validateCaseRecord({ ...fixture, type: 'อื่น' }));
  assert.throws(() => subject.validateCaseRecord({ ...fixture, petitionerName: ' ' }));
  assert.throws(() => subject.validateCaseRecord({ ...fixture, blackNumber: ['123/68'] }));
  assert.throws(() => subject.validateCaseRecord({ ...fixture, proceedingNote: 'x'.repeat(10001) }));
});
test('blank original red cell remains pending and user-controlled permission/assignment fields are rejected', async () => {
  const subject = await modulePromise;
  assert.ok(subject, 'case editor validation must exist');
  const record = subject.validateCaseRecord({ ...fixture, registryRedText: ' ', currentStatus: 'เสร็จสิ้น' });
  assert.equal(record.currentStatus, 'อยู่ระหว่างดำเนินการ');
  assert.equal(record.registryRedText, null);
  assert.throws(() => subject.validateCaseRecord({ ...fixture, ownerId: 'some-user' }));
});
test('numeric red values preserve uniqueness while arbitrary red text stays literal', async () => {
  const subject = await modulePromise;
  assert.ok(subject, 'case editor validation must exist');
  const record = subject.validateCaseRecord({ ...fixture, registryRedText: '45/68' });
  assert.equal(record.redNumber, '45/68');
  assert.equal(record.registryRedText, '45/68');
  for (const text of ['เลขแดง 45/69', '๔๕ / ๖๙', '45 / 69 (วินิจฉัยแล้ว)']) {
    assert.equal(subject.validateCaseRecord({ ...fixture, registryRedText: text }).redNumber, '45/69');
  }
});
