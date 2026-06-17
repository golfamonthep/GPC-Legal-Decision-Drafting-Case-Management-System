# Pilot Data Cleanup Strategy

## 1. Identification
Pilot records can be identified using the `PILOT-` and `PILOT_` prefixes.
- Cases: `blackNumber` starts with `PILOT-CASE-`.
- Drafts: `title` starts with `PILOT_DRAFT_`.
- Meetings: `meetingNo` starts with `PILOT-MTG-`.
- Users: email ends with `@example.test` and name starts with `Pilot `.

## 2. Safe Deletion Candidates
- It is safe to delete any `Case` with `blackNumber` starting with `PILOT-CASE-`.
- Deleting a `Case` will cascade and delete associated `CaseEvent`, `CaseDocument`, `DecisionDraft` and `MeetingAgendaItem` (assuming Prisma schema onDelete: Cascade is configured).
- It is safe to delete `User` records with pilot emails.
- It is safe to delete `Meeting` with `meetingNo` starting with `PILOT-MTG-`.

## 3. Archival Instead of Deletion
- Audit logs should NOT be deleted. They will naturally roll off or serve as history of the pilot test.
- Any real cases used in a controlled real-case trial should NOT be deleted, but progressed to finalization and archived naturally.

## 4. Avoiding Deletion of Real Records
- Do NOT use blanket `DELETE FROM "Case"` or Prisma `deleteMany` without `startsWith: 'PILOT-'` or exact `in: [...]` identifiers.
- A manual review requirement must be met before executing SQL or scripts on production.

## 5. Cleanup Order
1. Delete `MeetingAgendaItem` (if not cascaded).
2. Delete `Meeting`.
3. Delete `DecisionDraft` and `DecisionDraftSection`.
4. Delete `CaseEvent`.
5. Delete `CaseDocument`.
6. Delete `Case`.
7. Delete `User`.

*(Due to Prisma onDelete: Cascade on most models, deleting the `Case`, `Meeting`, and `User` from the top level is often sufficient).*

## 6. Manual Review Requirement
- No automated destructive cleanup script will be implemented at this stage.
- Cleanup will be executed via manual Prisma Studio or direct Supabase SQL Editor under strict dual-person review.

## 7. Future Cleanup Script
If a script is required later, recommend Prompt 49B: Safe Pilot Data Cleanup Tool with Dry-Run and Audit.

## 8. Cleanup Readiness
- Pilot records can be reliably identified by `PILOT_` or `PILOT-` prefix.
- No destructive cleanup script was run.
- Real data deletion is explicitly prohibited.
- Cleanup execution not yet performed (waiting for real seed to happen).
