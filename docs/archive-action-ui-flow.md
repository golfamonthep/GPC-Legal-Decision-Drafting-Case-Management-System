# Archive UI Flow

## User Journey
1. User opens `/records-retention`.
2. User filters archive-ready cases in the Retention Queue.
3. User selects case(s) using checkboxes (to be implemented).
4. User clicks "Archive Selected Cases" (to be implemented).
5. System shows an impact preview dialog.
6. User provides a reason for archiving.
7. User is required to type a confirmation phrase (e.g., "CONFIRM ARCHIVE").
8. A dry-run preview runs in the background.
9. If eligible, the system enables the final "Execute Archive" button.
10. Execute sends `POST` request, writes archive status and audit.
11. User sees a result summary toast/modal.
12. Case moves to archived/retained state in the UI.
13. A reversal workflow is available in a separate "Archived Records" view.

## Safety UI Requirements
- Default mode is read-only.
- Archive button is hidden unless the user has `MANAGE_RECORDS_ARCHIVE` permission.
- Destructive delete/purge buttons are strictly prohibited and not present.
- Confirmation phrase is mandatory before execution.
- High-risk warning must be clearly displayed.
- Blocked reasons (if ineligible) are visible to the user.
- No confidential data (like subject names) is displayed in raw error toasts or logs.
- No action is available or visible for unauthorized roles.
