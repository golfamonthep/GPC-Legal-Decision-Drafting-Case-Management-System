# Archive Staging Role Account Checklist

To successfully verify the archive execution flow in the staging environment, the following test accounts MUST be provisioned with valid Microsoft Entra ID logins and assigned the appropriate roles in the staging database.

## Prerequisites
- Real Microsoft accounts (e.g. `test.admin@yourdomain.com`) must exist to pass NextAuth Azure AD OAuth.
- These accounts must be added to the Staging DB `User` table (via the Admin UI or seed script) with the corresponding roles.

## Role Checklist

### 1. Unauthorized / No Retention Permission
- **Role Name**: LEGAL_OFFICER (or any role without retention permissions)
- **Permissions Expected**: Neither `PREVIEW_ARCHIVE` nor `ARCHIVE_CASE`
- **Login Availability**: [ ] Available
- **Test Route**: `/records-retention` and POST `/api/records-retention/archive/preview`
- **Expected Access**: 403 Forbidden on API; UI should not show archive buttons
- **Actual Result**: Pending
- **Status**: ❌ BLOCKED

### 2. VIEW_RECORDS_RETENTION Only
- **Role Name**: VIEWER (if configured for basic view only)
- **Permissions Expected**: `VIEW_RECORDS_ARCHIVE`
- **Login Availability**: [ ] Available
- **Test Route**: `/records-retention`
- **Expected Access**: Can view the retention list, but cannot trigger dry-run preview or execution.
- **Actual Result**: Pending
- **Status**: ❌ BLOCKED

### 3. PREVIEW_ARCHIVE Only
- **Role Name**: COMMISSIONER or specifically tuned role
- **Permissions Expected**: `VIEW_RECORDS_ARCHIVE`, `PREVIEW_ARCHIVE` (No `ARCHIVE_CASE`)
- **Login Availability**: [ ] Available
- **Test Route**: POST `/api/records-retention/archive/preview` and POST `/api/records-retention/archive/execute`
- **Expected Access**: Can run dry-run preview. Execution API returns 403 Forbidden. UI hides execution button.
- **Actual Result**: Pending
- **Status**: ❌ BLOCKED

### 4. EXECUTE_ARCHIVE
- **Role Name**: REGISTRY_OFFICER (or specific operator role)
- **Permissions Expected**: `VIEW_RECORDS_ARCHIVE`, `PREVIEW_ARCHIVE`, `ARCHIVE_CASE`
- **Login Availability**: [ ] Available
- **Test Route**: POST `/api/records-retention/archive/execute`
- **Expected Access**: Can execute archive (provided environment gate is passed).
- **Actual Result**: Pending
- **Status**: ❌ BLOCKED

### 5. Admin / System Admin
- **Role Name**: ADMIN
- **Permissions Expected**: All permissions
- **Login Availability**: [ ] Available
- **Test Route**: Full end-to-end execution and audit verification
- **Expected Access**: Full access to preview and execute.
- **Actual Result**: Pending
- **Status**: ❌ BLOCKED

### 6. Optional VIEW_ARCHIVE_AUDIT
- **Role Name**: ADMIN or AUDITOR
- **Permissions Expected**: `VIEW_ARCHIVE_AUDIT`
- **Login Availability**: [ ] Available
- **Test Route**: System Admin Audit page
- **Expected Access**: Can view archive execution batches and itemized impact.
- **Actual Result**: Pending
- **Status**: ❌ BLOCKED
