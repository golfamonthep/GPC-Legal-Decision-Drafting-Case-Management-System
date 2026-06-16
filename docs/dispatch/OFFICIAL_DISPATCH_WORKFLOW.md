# Official Dispatch and Notification Workflow

## Purpose
This workflow tracks the process of officially notifying the petitioner, respondent, and other relevant parties after a decision is finalized and signed. It ensures that the required legal period for filing a case in the administrative court is correctly tracked.

## Roles and Permissions
- `ADMIN`: Full access
- `COMMISSIONER`: `VIEW_DISPATCH_WORKFLOW`, `EXPORT_DISPATCH_REPORT`
- `LEGAL_OFFICER`: `VIEW_DISPATCH_WORKFLOW`, `MANAGE_DISPATCH_WORKFLOW`, `EXPORT_DISPATCH_REPORT`
- `REGISTRY_OFFICER`: `VIEW_DISPATCH_WORKFLOW`, `MANAGE_DISPATCH_WORKFLOW`, `RECORD_OFFICIAL_NOTIFICATION`, `RECORD_ACKNOWLEDGEMENT`, `EXPORT_DISPATCH_REPORT`

## Workflow Statuses
1. `NOT_STARTED` (ยังไม่เริ่ม)
2. `PREPARING_NOTICE` (อยู่ระหว่างจัดทำหนังสือแจ้งผล)
3. `NOTICE_READY` (หนังสือแจ้งผลพร้อมส่ง)
4. `DISPATCHED` (ส่งแจ้งผลแล้ว)
5. `ACKNOWLEDGED` (รับทราบแล้ว)
6. `RETURNED_UNDELIVERED` (ส่งไม่สำเร็จ/ตีกลับ)
7. `RE_DISPATCH_REQUIRED` (ต้องส่งใหม่)
8. `COMPLETED` (เสร็จสิ้นการแจ้งผล)
9. `ON_HOLD` (พักการดำเนินการ)

## Key Processes

### 1. Initialization
The workflow is initialized manually by a Legal Officer after the case decision is finalized (`POST /api/cases/[id]/dispatch`).

### 2. Notice Preparation and Dispatch
Registry Officers or Legal Officers prepare the official notice and record the dispatch method (e.g., registered mail, in-person, electronic) along with the tracking number and dispatch date.

### 3. Acknowledgement Recording
Recording the acknowledgement is a critical step because the court filing period starts from the date of acknowledgement.
- An acknowledgement date must not be before the dispatch date unless a specific override reason is provided.

### 4. Returned Dispatches
If a document is returned undelivered, it is logged with a reason, and the status changes to `RETURNED_UNDELIVERED` or `RE_DISPATCH_REQUIRED`.

## Audit and Security
Every action creates a `CaseEvent` for timeline tracking and an `AuditLog` entry. No personal data from the legal draft is exposed in the dispatch status logs.

## Important Rule
**Do not automate notification.** Official notification requires explicit human action and confirmation. The system acts as a tracker, not an automated mailer.
