# Archive Execution Permission Plan

## Overview
This document outlines the recommended changes to the application's RBAC system to securely govern records retention and archive execution workflows.

## Recommended New Permissions

1. **VIEW_RECORDS_RETENTION**
   - **Purpose**: View the records retention dashboard and read-only archive lists.
   - **Role Mapping**: `ADMIN`, `COMMISSIONER`, `LEGAL_OFFICER`, `REGISTRY_OFFICER`.

2. **MANAGE_RECORDS_RETENTION**
   - **Purpose**: Manage retention policies, adjust retention due dates, and manage knowledge reuse reviews.
   - **Role Mapping**: `ADMIN`, `REGISTRY_OFFICER`.

3. **PREVIEW_ARCHIVE**
   - **Purpose**: Execute dry-run previews to see the impact of an archive action.
   - **Role Mapping**: `ADMIN`, `REGISTRY_OFFICER`.

4. **EXECUTE_ARCHIVE**
   - **Purpose**: Perform the actual destructive (state-mutating) archive transaction.
   - **Role Mapping**: `ADMIN`, `REGISTRY_OFFICER`.

5. **REVERSE_ARCHIVE**
   - **Purpose**: Unarchive a case and restore its previous status.
   - **Role Mapping**: `ADMIN` (Restricted to higher-level roles to prevent accidental toggling).

6. **VIEW_ARCHIVE_AUDIT**
   - **Purpose**: View the specific audit logs and batches related to archiving actions.
   - **Role Mapping**: `ADMIN`, `COMMISSIONER`.

## Enforcement Strategy

1. **Pages/APIs**:
   - `/records-retention` page -> `VIEW_RECORDS_RETENTION`
   - `/api/records-retention/archive/preview` -> `PREVIEW_ARCHIVE`
   - Future `/api/records-retention/archive/execute` -> `EXECUTE_ARCHIVE`
   
2. **Unauthorized Handling**:
   - APIs will use `requireApiPermission`, returning 401/403.
   - The UI will conditionally render the execution button based on `hasPermission(role, 'EXECUTE_ARCHIVE')`.
   - If a user can view but not execute, the button should be hidden or disabled with a tooltip indicating "Insufficient Permissions".

3. **UAT Requirements**:
   - Role-based UAT must verify that a `VIEWER` or `LEGAL_OFFICER` cannot POST to the execute endpoint, ensuring backend enforcement.
