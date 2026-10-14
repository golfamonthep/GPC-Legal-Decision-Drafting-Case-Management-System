import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DispatchPanel } from '../components/DispatchPanel';
import { calculateFilingDeadline } from './dispatch/courtDeadline';
import { OfficialDispatchStatus, CourtFollowupStatus } from './dispatch/officialDispatchStatus';

test('dispatch detail keeps the current proceeding state but never exposes computed deadlines or risk', () => {
  const html = renderToStaticMarkup(createElement(DispatchPanel, {
    caseId: 'test-case', dispatchData: { dispatchStatus: OfficialDispatchStatus.ACKNOWLEDGED, courtFollowupStatus: CourtFollowupStatus.COURT_CASE_IN_PROGRESS, acknowledgementDate: '2020-01-01', filingPeriodDays: 90, courtCaseNumber: 'ทดสอบ/69' },
    deadlineInfo: calculateFilingDeadline('2020-01-01', 90),
    permissions: { canManageDispatch: false, canRecordNotification: false, canRecordAcknowledgement: false, canRecordCourtFiling: false, canManageCourtFollowup: false },
  }));
  assert.match(html, /อยู่ระหว่างดำเนินคดีศาลปกครอง/);
  assert.match(html, /ทดสอบ\/69/);
  assert.doesNotMatch(html, /วันครบกำหนด|ระดับความเสี่ยง|เกินกำหนด/);
});
