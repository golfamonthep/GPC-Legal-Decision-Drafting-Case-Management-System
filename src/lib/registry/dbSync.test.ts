import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateCaseWithSnapshot, hydrateCasesWithSnapshot, syncSnapshotToDatabase } from './dbSync';

test('hydrateCaseWithSnapshot fills missing proceedingNote from snapshot', () => {
  const mockCase = {
    id: 'case-1',
    blackNumber: '56/66',
    proceedingNote: null as string | null,
    registryRedText: null as string | null,
  };

  const hydrated = hydrateCaseWithSnapshot(mockCase);
  assert.ok(hydrated.proceedingNote, 'proceedingNote should be hydrated from snapshot');
  assert.ok(hydrated.proceedingNote?.includes('ส่งคำแก้ร้องทุกข์'), 'should match case 56/66 proceeding note');
});

test('hydrateCaseWithSnapshot preserves existing non-empty proceedingNote', () => {
  const mockCase = {
    id: 'case-2',
    blackNumber: '56/66',
    proceedingNote: 'หมายเหตุเฉพาะที่มีอยู่แล้ว',
  };

  const hydrated = hydrateCaseWithSnapshot(mockCase);
  assert.equal(hydrated.proceedingNote, 'หมายเหตุเฉพาะที่มีอยู่แล้ว');
});

test('hydrateCasesWithSnapshot handles multiple records', () => {
  const cases = [
    { id: '1', blackNumber: '56/66', proceedingNote: null },
    { id: '2', blackNumber: '57/66', proceedingNote: '' },
    { id: '3', blackNumber: '99999/99', proceedingNote: null },
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
