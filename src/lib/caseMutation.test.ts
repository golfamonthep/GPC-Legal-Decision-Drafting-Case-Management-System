import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '../generated/prisma';

const servicePromise = import('./caseMutation').catch(() => null);
const input = { type: 'ร้องทุกข์', blackNumber: '1/69', petitionerName: 'ผู้ร้องทดสอบ', subject: 'เรื่องทดสอบ', registryRedText: '', proceedingNote: 'รอคำชี้แจง' };
const actor = { id: 'mvp-test-user', name: 'ผู้ทดสอบ', email: 'test@example.test', role: 'ADMIN', status: 'ACTIVE' };
function database() {
  let record: Record<string, unknown> | null = null;
  const audits: unknown[] = [], events: unknown[] = [];
  const tx = {
    case: {
      async findUnique() { return record; },
      async findUniqueOrThrow() { if (!record) throw new Error('not found'); return record; },
      async create({ data }: { data: object }) { record = { ...data, id: 'test-id', updatedAt: new Date('2026-10-14T00:00:00Z') }; return record; },
      async updateMany({ where, data }: { where: { updatedAt: Date }; data: object }) {
        if (record?.updatedAt instanceof Date && record.updatedAt.getTime() === where.updatedAt.getTime()) { record = { ...record, ...data }; return { count: 1 }; }
        return { count: 0 };
      },
    },
    auditLog: { async create({ data }: { data: unknown }) { audits.push(data); } },
    caseEvent: { async create({ data }: { data: unknown }) { events.push(data); } },
  };
  return { db: { $transaction: async (callback: (port: unknown) => unknown) => callback(tx) } as unknown as PrismaClient, audits, events, get record() { return record; } };
}
test('manual creation persists the record and attributable history, and does not accept read-only actors', async () => {
  const service = await servicePromise;
  assert.ok(service, 'safe case mutation service must exist');
  const d = database();
  const saved = await service.saveCaseRecord(d.db, actor, input);
  assert.equal(saved.id, 'test-id');
  assert.equal(d.record?.proceedingNote, 'รอคำชี้แจง');
  assert.equal(d.audits.length, 1);
  assert.equal(d.events.length, 1);
  assert.equal((d.events[0] as { actorName: string }).actorName, 'ผู้ทดสอบ');
  const denied = database();
  await assert.rejects(service.saveCaseRecord(denied.db, { ...actor, role: 'VIEWER' }, input), /สิทธิ์/);
  assert.equal(denied.record, null);
  assert.equal(denied.audits.length, 0);
});
test('editing honors the version shown to the user; stale requests neither overwrite nor append history', async () => {
  const service = await servicePromise;
  assert.ok(service, 'safe case mutation service must exist');
  const d = database();
  await service.saveCaseRecord(d.db, actor, input);
  await assert.rejects(service.saveCaseRecord(d.db, actor, { ...input, proceedingNote: 'ข้อมูลเก่า', expectedUpdatedAt: '2025-01-01T00:00:00Z' }, 'test-id'), /เปลี่ยนแปลง/);
  assert.equal(d.record?.proceedingNote, 'รอคำชี้แจง');
  assert.equal(d.audits.length, 1);
  const saved = await service.saveCaseRecord(d.db, actor, { ...input, proceedingNote: 'รอตรวจร่าง', expectedUpdatedAt: '2026-10-14T00:00:00Z' }, 'test-id');
  assert.equal(saved.proceedingNote, 'รอตรวจร่าง');
  assert.equal(d.audits.length, 2);
  assert.equal(d.events.length, 2);
});

test('quick proceeding updates cannot overwrite a newer full edit and preserve all other case fields', async () => {
  const service = await servicePromise;
  assert.ok(service);
  assert.equal(typeof service.saveCaseProgress, 'function', 'progress update needs the same version guard');
  const d = database();
  await service.saveCaseRecord(d.db, actor, input);
  await assert.rejects(service.saveCaseProgress(d.db, actor, { currentStatus: 'รอตรวจร่าง', proceedingNote: 'เก่า', expectedUpdatedAt: '2025-01-01' }, 'test-id'), /เปลี่ยนแปลง/);
  const saved = await service.saveCaseProgress(d.db, actor, { currentStatus: 'รอตรวจร่าง', proceedingNote: 'ร่างพร้อมตรวจ', expectedUpdatedAt: '2026-10-14T00:00:00Z' }, 'test-id');
  assert.equal(saved.subject, 'เรื่องทดสอบ');
  assert.equal(saved.petitionerName, 'ผู้ร้องทดสอบ');
  assert.equal(saved.proceedingNote, 'ร่างพร้อมตรวจ');
  assert.equal(d.events.length, 2);
});
