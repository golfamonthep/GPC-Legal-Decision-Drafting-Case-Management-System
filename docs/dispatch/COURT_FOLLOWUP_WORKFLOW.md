# Administrative Court Follow-up Workflow

## Purpose
Tracks cases that are within the 90-day (or extended) period where a party may file a case with the Administrative Court against the ก.พ.ค.ตร. decision, and tracks the progress of the court case if filed.

## Roles and Permissions
- `ADMIN`: Full access
- `COMMISSIONER`: `VIEW_DISPATCH_WORKFLOW`, `EXPORT_COURT_FOLLOWUP_REPORT`
- `LEGAL_OFFICER`: `VIEW_DISPATCH_WORKFLOW`, `RECORD_COURT_FILING`, `MANAGE_COURT_FOLLOWUP`, `EXPORT_COURT_FOLLOWUP_REPORT`
- `REGISTRY_OFFICER`: `VIEW_DISPATCH_WORKFLOW`

## Court Follow-up Statuses
1. `NOT_APPLICABLE` (ไม่เกี่ยวข้อง)
2. `WAITING_FOR_FILING_PERIOD` (รอเริ่มนับระยะเวลาฟ้องคดี)
3. `FILING_PERIOD_ACTIVE` (อยู่ในระยะเวลาฟ้องคดี)
4. `NO_COURT_CASE_REPORTED` (ยังไม่มีรายงานการฟ้องคดี)
5. `COURT_CASE_FILED` (มีการฟ้องคดีต่อศาลแล้ว)
6. `COURT_CASE_IN_PROGRESS` (อยู่ระหว่างดำเนินคดีศาลปกครอง)
7. `COURT_JUDGMENT_RECEIVED` (ได้รับคำพิพากษา/คำสั่งศาลแล้ว)
8. `COURT_FOLLOWUP_COMPLETED` (เสร็จสิ้นการติดตามศาล)
9. `ON_HOLD` (พักการติดตาม)

## Key Processes

### 1. Filing Deadline Tracking
The filing deadline is automatically calculated from the date of acknowledgement recorded in the dispatch workflow (default +90 days).
> **Warning**: The system-calculated deadline is for operational tracking only. It must be verified against actual legal requirements and facts for each case.

### 2. Court Filing Record
If a party files a case with the Administrative Court, a Legal Officer records the court name, case number, filed date, and status.

### 3. Court Event Tracking
Subsequent events (e.g., submission of statement, court orders, hearings) are recorded to maintain a history of the litigation.

### 4. Court Judgment
When a judgment is received, the summary and category (e.g., dismissed, revoked) are recorded.
**Important**: Recording a judgment does *not* automatically change the original case's decision outcome. Any reversal or modification requires an explicit human/legal review and confirmation.

## Audit Logging
All changes to court status, new events, and judgments are recorded in the `AuditLog` and `CaseEvent` timeline.
