# Post-Meeting Follow-up and Decision Finalization Workflow

## Purpose
This workflow manages cases after they have been presented to the GPC board. It enforces strict deterministic status tracking to ensure decisions are properly revised, reviewed, finalized, and logged without unauthorized changes or automated AI finalization.

## Roles and Permissions
- `VIEW_POST_MEETING_FOLLOWUP`: Can view the finalization dashboard and case statuses. (ADMIN, COMMISSIONER, LEGAL_OFFICER, REGISTRY_OFFICER)
- `MANAGE_POST_MEETING_FOLLOWUP`: Can initialize the workflow and track revisions. (ADMIN, LEGAL_OFFICER)
- `MARK_DRAFT_REVISION_REQUIRED` / `MARK_DRAFT_REVISED`: Can mark drafts as revised. (ADMIN, LEGAL_OFFICER)
- `VERIFY_FINAL_READINESS`: Can verify readiness checklist. (ADMIN, COMMISSIONER, LEGAL_OFFICER)
- `RECORD_RED_CASE_NUMBER`: Can assign red numbers. (ADMIN, REGISTRY_OFFICER)
- `FINALIZE_DECISION`: Can mark the decision as fully finalized. (ADMIN)
- `EXPORT_FINAL_DECISION_DOCX`: Can export the final verified decision document. (ADMIN, COMMISSIONER, LEGAL_OFFICER)
- `LINK_SIGNED_DECISION`: Can link external signed documents to the system. (ADMIN, LEGAL_OFFICER, REGISTRY_OFFICER)
- `CLOSE_CASE_AFTER_DECISION`: Can close the case upon finalization. (ADMIN, REGISTRY_OFFICER)

## Post-Meeting Workflow Statuses
- `NOT_STARTED` (ยังไม่เริ่ม)
- `REVISION_REQUIRED` (ต้องแก้ไขร่าง)
- `REVISION_IN_PROGRESS` (อยู่ระหว่างแก้ไขร่าง)
- `REVISED_PENDING_REVIEW` (แก้ไขแล้วรอตรวจ)
- `FINAL_REVIEW` (ตรวจร่างฉบับสุดท้าย)
- `READY_FOR_RED_NUMBER` (พร้อมออกเลขแดง)
- `RED_NUMBER_RECORDED` (บันทึกเลขแดงแล้ว)
- `READY_FOR_SIGNATURE` (พร้อมเสนอ/ลงนาม)
- `SIGNED` (ลงนามแล้ว)
- `FINALIZED` (เสร็จสิ้นฉบับสมบูรณ์)
- `CLOSED` (ปิดสำนวน)
- `ON_HOLD` (พักการดำเนินการ)

## Revision Workflow
1. When a meeting result is recorded as "ให้แก้ไขร่าง", the status transitions to `REVISION_REQUIRED`.
2. The legal officer revises the draft.
3. The legal officer marks the revision as completed, transitioning the status to `REVISED_PENDING_REVIEW` or `READY_FOR_RED_NUMBER`.
4. The system logs the revision.

## Final Readiness Checklist
Before finalization, the system checks:
- Meeting result is recorded.
- Draft revision is completed (if requested).
- A red case number is assigned.

## Rules
- **No AI Finalization**: AI must NOT be used to rewrite or alter the approved draft content during finalization.
- **Red Case Number Recording**: Must be explicitly typed in and verified for duplicates.
- **Signed Document Linking**: Must use verified URLs.
- **Case Closure**: Must require explicit confirmation after all criteria are met.
- **Overrides**: Overrides must be logged with a mandatory reason.

## Audit Behavior
All finalization actions trigger `CaseEvent` and `AuditLog` creation for compliance.
