# Archive Execution Permission Decision

## Overview
This document evaluates whether the application has the necessary role-based access control (RBAC) permissions to securely manage archive execution workflows.

## Existing Permission Support
- **Permission to view retention UI**: Supported (`VIEW_RECORDS_ARCHIVE`).
- **Permission to run dry-run preview**: Supported (uses `MANAGE_RECORDS_ARCHIVE`).
- **Permission to execute archive**: Supported (`ARCHIVE_CASE` exists in enum).
- **Permission to reverse archive**: Supported (`UNARCHIVE_CASE` exists in enum).
- **Permission to view archive audit records**: Partially supported (relies on generic `VIEW_AUDIT_LOGS`).

## Preferred Permissions vs Reality
- `VIEW_RECORDS_RETENTION`: Missing (mapped to `VIEW_RECORDS_ARCHIVE`).
- `MANAGE_RECORDS_RETENTION`: Missing (mapped to `MANAGE_RECORDS_ARCHIVE`).
- `PREVIEW_ARCHIVE`: Missing.
- `VIEW_ARCHIVE_AUDIT`: Missing.

## Decision
**CONDITIONALLY READY**. Dedicated execute and reverse permissions (`ARCHIVE_CASE`, `UNARCHIVE_CASE`) exist in the `PERMISSIONS` map and are granted to REGISTRY_OFFICER. However, there is no dedicated `PREVIEW_ARCHIVE` or `VIEW_ARCHIVE_AUDIT` permission. A permission update should separate `MANAGE_RECORDS_ARCHIVE` (policy configuration) from `ARCHIVE_CASE` (execution).
