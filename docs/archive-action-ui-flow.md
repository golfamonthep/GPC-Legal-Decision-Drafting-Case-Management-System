# Archive UI Flow

## User Journey
1. User opens `/records-retention`.
2. User filters archive-ready cases in the Retention Queue.
3. User inputs or selects case(s) using the new Dry-Run Preview Panel.
4. User clicks "Preview Archive Impact".
5. System calls `POST /api/records-retention/archive/preview` (dry-run).
6. System displays an impact preview with eligible count, blocked reasons, and warnings.
7. Future implementation: User provides a reason, policy reference, and a confirmation phrase to execute.
8. Future implementation: Execute sends `POST` request, writes archive status and audit.
9. User sees a result summary toast/modal.
10. Case moves to archived/retained state in the UI.
11. A reversal workflow is available in a separate "Archived Records" view.

## Safety UI Requirements
- Default mode is read-only.
- Archive button is hidden unless the user has `MANAGE_RECORDS_ARCHIVE` permission.
- Destructive delete/purge buttons are strictly prohibited and not present.
- Confirmation phrase is mandatory before execution.
- High-risk warning must be clearly displayed.
- Blocked reasons (if ineligible) are visible to the user.
- No confidential data (like subject names) is displayed in raw error toasts or logs.
- No action is available or visible for unauthorized roles.
