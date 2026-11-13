import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateCaseWithSnapshot, hydrateCasesWithSnapshot, syncSnapshotToDatabase } from './dbSync';

test('hydrateCaseWithSnapshot fills missing proceedingNote from snapshot', () => {
  const mockCase = {
    id: 'case-1',
    type: 'ร้องทุกข์',
    blackNumber: '56/66',
    proceedingNote: null as string | null,
    registryRedText: null as string | null,
  };

  const hydrated = hydrateCaseWithSnapshot(mockCase);
  assert.ok(hydrated.proceedingNote, 'proceedingNote should be hydrated from snapshot');
  assert.ok(hydrated.proceedingNote?.includes('ส่งคำแก้ร้องทุกข์'), 'should match case 56/66 proceeding note');
});

test('hydrateCaseWithSnapshot preserves newer DB proceedingNote and overwrites stale DB proceedingNote', () => {
  const newerDbCase = {
    id: 'case-2',
    type: 'ร้องทุกข์',
    blackNumber: '56/66',
    proceedingNote: 'หมายเหตุเฉพาะที่เพิ่งแก้ไขบนเว็บ',
    updatedAt: new Date(Date.now() + 86_400_000),
  };

  const hydratedNewer = hydrateCaseWithSnapshot(newerDbCase);
  assert.equal(hydratedNewer.proceedingNote, 'หมายเหตุเฉพาะที่เพิ่งแก้ไขบนเว็บ');

  const staleDbCase = {
    id: 'case-3',
    type: 'ร้องทุกข์',
    blackNumber: '56/66',
    proceedingNote: 'ข้อมูลเก่าจากเดือนก่อน',
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  const hydratedStale = hydrateCaseWithSnapshot(staleDbCase);
  assert.ok(hydratedStale.proceedingNote.includes('ส่งคำแก้ร้องทุกข์'));
});

test('hydrateCasesWithSnapshot handles multiple records and composite type keys', () => {
  const cases = [
    { id: '1', type: 'ร้องทุกข์', blackNumber: '56/66', proceedingNote: null },
    { id: '2', type: 'ร้องทุกข์', blackNumber: '57/66', proceedingNote: '' },
    { id: '3', type: 'ร้องทุกข์', blackNumber: '99999/99', proceedingNote: null },
  ];

  const hydrated = hydrateCasesWithSnapshot(cases);
  assert.ok(hydrated[0].proceedingNote);
  assert.ok(hydrated[1].proceedingNote);
  assert.equal(hydrated[2].proceedingNote, null); // Not in snapshot
});

test('syncSnapshotToDatabase returns early when DATABASE_URL is missing or placeholder', async () => {
  const result = await syncSnapshotToDatabase(null);
  assert.equal(result.success, false);
  assert.ok(result.message.includes('DATABASE_URL'));
});
