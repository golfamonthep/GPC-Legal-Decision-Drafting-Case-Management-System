import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldRefreshCaseView } from './caseRefresh';

test('refreshes a clean view when a case revision changes', () => {
  assert.equal(shouldRefreshCaseView('216:2026-10-14T09:00:00.000Z', '216:2026-10-14T09:01:00.000Z', false), true);
  assert.equal(shouldRefreshCaseView('216:2026-10-14T09:00:00.000Z', '216:2026-10-14T09:00:00.000Z', false), false);
});

test('does not overwrite an edited form or refresh before a baseline exists', () => {
  assert.equal(shouldRefreshCaseView('216:a', '216:b', true), false);
  assert.equal(shouldRefreshCaseView(null, '216:a', false), false);
});
