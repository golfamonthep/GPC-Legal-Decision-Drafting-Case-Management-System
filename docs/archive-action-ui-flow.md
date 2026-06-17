# Archive UI Flow

## User Journey
1. User opens `/records-retention`.
2. User filters archive-ready cases in the Retention Queue.
3. User inputs or selects case(s) using the new Dry-Run Preview Panel.
4. User clicks "Preview Archive Impact".
5. System calls `POST /api/records-retention/archive/preview` (dry-run).
6. System displays an impact preview with eligible count, blocked reasons, and warnings.
7. User provides a reason, optional policy reference.
8. User types the exact confirmation phrase ("ARCHIVE PILOT CASES" or "ยืนยันจัดเก็บสำนวน").
9. User clicks Execute.
10. System calls `POST /api/records-retention/archive/execute`.
11. System displays a result summary including the batch ID and archived count.
12. Case moves to archived/retained state in the database.
13. A reversal workflow is available via API (UI for reversal is future work).

## Safety UI Requirements
- Default mode is read-only.
- Archive button is hidden unless the user has `MANAGE_RECORDS_ARCHIVE` permission.
- Destructive delete/purge buttons are strictly prohibited and not present.
- Confirmation phrase is mandatory before execution.
- High-risk warning must be clearly displayed.
- Blocked reasons (if ineligible) are visible to the user.
- No confidential data (like subject names) is displayed in raw error toasts or logs.
- No action is available or visible for unauthorized roles.
  
## Execution Readiness  
Archive execution UI is **IMPLEMENTED** but strictly gated to **STAGING ONLY**.
The UI enforces a Preview-First requirement, requires an exact confirmation phrase, and requires a reason.
Production execution remains intentionally disabled and is enforced by both the UI (which hides the execute button based on an environment API check) and the backend API (which returns 423 Locked).
Destructive delete/purge actions remain out of scope and unimplemented.
