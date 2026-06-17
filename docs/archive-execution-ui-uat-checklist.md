# Archive Execution UI UAT Checklist

This checklist verifies the safety and functionality of the Archive Execution UI, ensuring it respects permissions, environment gates, and confirmation rules.

## Setup
1. Deploy or run the app in a **Staging** environment (`ALLOW_STAGING_ARCHIVE_EXECUTION=YES`).
2. Have test accounts ready with varying permissions.

## 1. Authentication and Authorization Guard
- [ ] **Unauthenticated Access**: Verify an unauthenticated user attempting to access `/records-retention` is redirected to `/login`.
- [ ] **Unauthorized Role**: Log in as a user without `VIEW_RECORDS_ARCHIVE` and verify the page is inaccessible (403/NotFound).
- [ ] **Viewer Role**: Log in as a user with `VIEW_RECORDS_ARCHIVE` but WITHOUT `PREVIEW_ARCHIVE`. Verify the page loads but the Preview panel displays "ไม่มีสิทธิ์จำลองการจัดเก็บ" (No permission to preview).

## 2. Dry-Run Preview Flow
- [ ] **Empty Selection**: With `PREVIEW_ARCHIVE` permission, verify the "Preview Archive Impact" button is disabled when the Case IDs input is empty.
- [ ] **Invalid Cases**: Enter invalid or ineligible Case IDs. Verify the preview runs and returns a "Blocked" status with specific reasons, and the Execute section is not enabled.
- [ ] **Eligible Cases**: Enter eligible Case IDs. Verify the preview runs, returns an "Eligible" count > 0, and the Execution section becomes visible.

## 3. Execution Confirmation Gates
- [ ] **Missing Reason**: With an eligible preview, verify the Execute button remains disabled when the Reason field is empty.
- [ ] **Wrong Confirmation Phrase**: Enter a reason but type a wrong confirmation phrase (e.g., "test"). Verify the Execute button remains disabled.
- [ ] **Correct Confirmation Phrase**: Type exactly "ARCHIVE PILOT CASES" or "ยืนยันจัดเก็บสำนวน". Verify the Execute button becomes enabled.

## 4. Execution API and Environment Guard
- [ ] **Staging Execution Success**: In a staging environment, click Execute with valid inputs. Verify a green success banner appears showing the archived count and a Batch ID.
- [ ] **Production Blocked**: Change environment to production (or simulate by removing the staging flag). Refresh the page. Verify the Execution section is replaced by a yellow "Production Execution Disabled" warning banner.
- [ ] **API Re-Check**: Attempt to directly `POST` to `/api/records-retention/archive/execute` in production using Postman/curl. Verify the API returns `423 Locked`.

## 5. Safety and UI Sanity
- [ ] **No Delete/Purge Controls**: Verify there are no buttons or options to permanently delete or purge cases.
- [ ] **No Secrets Exposed**: Verify that success and error toasts do not expose raw stack traces, database credentials, or secret keys.
- [ ] **No Render-time Mutations**: Verify that simply loading the `/records-retention` page does not trigger any archive database updates or audit logs.
- [ ] **Audit Linkage**: After a successful execution, check the database (or admin audit logs if available) to verify an `ArchiveBatch` was created and linked to an `AuditLog` entry.
