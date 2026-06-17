# Records Retention Role & Permission Mapping

## Added Permissions

- `VIEW_RECORDS_ARCHIVE`: (Existing/Reused) View records retention overview and queue.
- `PREVIEW_ARCHIVE`: (New) Run dry-run archive preview.
- `EXECUTE_ARCHIVE` (via `ARCHIVE_CASE`): (Existing/Reused) Future real archive execution. Not enabled.
- `REVERSE_ARCHIVE` (via `UNARCHIVE_CASE`): (Existing/Reused) Future archive reversal. Not enabled.
- `VIEW_ARCHIVE_AUDIT`: (New) View archive audit logs.
- `MANAGE_RECORDS_ARCHIVE`: (Existing) Manage retention metadata and policies.

## Role Mapping

- **ADMIN**: All permissions.
- **COMMISSIONER**: `VIEW_RECORDS_ARCHIVE`, `PREVIEW_ARCHIVE`, `VIEW_ARCHIVE_AUDIT`, `APPROVE_KNOWLEDGE_REUSE`, etc.
- **LEGAL_OFFICER**: `VIEW_RECORDS_ARCHIVE`, `PREVIEW_ARCHIVE`, `MARK_CASE_ARCHIVABLE`.
- **REGISTRY_OFFICER**: `VIEW_RECORDS_ARCHIVE`, `MANAGE_RECORDS_ARCHIVE`, `PREVIEW_ARCHIVE`, `ARCHIVE_CASE` (reserved), `MARK_CASE_ARCHIVABLE`.
- **VIEWER**: None.

## Remaining Gaps
- Archive execution remains not implemented.
- Delete/purge remains not implemented.
