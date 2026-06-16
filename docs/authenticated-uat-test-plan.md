# Authenticated UAT Test Plan

## 1. Pre-test Requirements

Before executing the User Acceptance Testing (UAT) plan, ensure the following are confirmed:
* The application is built and deployed to a staging or production-like environment.
* `NEXTAUTH_SECRET` and database connections are correctly configured and verified via `/api/health/db`.
* At least one system administrator (`ADMIN` role) user exists.
* Test accounts are prepared for each required role. Real passwords should not be used, and emails should be placeholders (e.g., `test.commissioner@example.com`).

## 2. UAT Test Users

| Role Name | Test Email | Password Strategy | Creation Method |
|-----------|------------|-------------------|-----------------|
| ADMIN | `test.admin@example.local` | (Test specific) | Existing/Manual Database insertion |
| COMMISSIONER | `test.commissioner@example.local` | (Test specific) | Via `/admin/users` UI |
| LEGAL_OFFICER | `test.drafter@example.local` | (Test specific) | Via `/admin/users` UI |
| REGISTRY_OFFICER | `test.registry@example.local` | (Test specific) | Via `/admin/users` UI |
| VIEWER | `test.viewer@example.local` | (Test specific) | Via `/admin/users` UI |

*Note: For these tests, we do not expose test passwords in documentation.*

## 3. Test Scenarios

### A. Unauthenticated Access
* **Action:** Access `/dashboard`, `/admin/system`, `/cases` without logging in.
* **Expected:** User is immediately redirected to `/login`. API calls return `401 Unauthorized`.

### B. Admin Access (SYSTEM_ADMIN)
* **Action:** Login as `ADMIN`. Access `/admin/users`, `/admin/system`, and `/admin/readiness`. Trigger a maintenance action confirmation.
* **Expected:** All pages load successfully. Maintenance actions require an explicit confirmation flow and trigger audit logs.

### C. Case Manager Access (COMMISSIONER)
* **Action:** Login as `COMMISSIONER`. Access `/dashboard`, `/cases`, and `/executive`. Attempt to access `/admin/system`.
* **Expected:** Dashboard and executive reports load successfully. Navigation to `/admin/system` redirects to dashboard with an Access Denied message.

### D. Drafter Workflow (LEGAL_OFFICER)
* **Action:** Login as `LEGAL_OFFICER`. Open an assigned case in `/cases/[id]/draft`. Run the 'AI Review Wording' tool (`/api/draft/review-wording`).
* **Expected:** Draft interface allows editing. AI tool returns successful payload. Accessing `/registry/import` fails.

### E. Reviewer / Finalization Workflow (COMMISSIONER / LEGAL_OFFICER)
* **Action:** Login as `COMMISSIONER`. Access `/finalization`. Attempt to review a case and mark it for revision.
* **Expected:** The finalization dashboard displays correctly. The user can view meetings and final readiness workflows.

### F. Dispatch Workflow (REGISTRY_OFFICER)
* **Action:** Login as `REGISTRY_OFFICER`. Access `/dispatch` and `/registry/import`. Attempt to export executive report (`/api/reports/executive/export`).
* **Expected:** Dispatch and Registry import pages load correctly. The executive report API returns `403 Forbidden`.

### G. Executive Read-only / Reporting (COMMISSIONER)
* **Action:** Login as `COMMISSIONER` and navigate to `/executive`.
* **Expected:** Executive statistics are fully visible and exportable.

### H. Read-only Viewer Restrictions (VIEWER)
* **Action:** Login as `VIEWER`. Access `/cases/[id]`. Attempt to edit a case, import registry data, or use AI drafting tools.
* **Expected:** Case details load in read-only mode. All mutation actions (`EDIT_CASE`, `USE_AI_DRAFT`) are hidden in the UI. Manual API calls return `403 Forbidden`.

### I. Unauthorized Write Attempts
* **Action:** Use a script or API client to send a POST request to `/api/admin/users` using a session token from a `VIEWER` account.
* **Expected:** The API strictly enforces backend authorization and returns a `403 Forbidden` response.

### J. Admin Maintenance Action Confirmation Checks
* **Action:** Navigate to `/admin/system` as `ADMIN`. Click a maintenance action (e.g., clear cache).
* **Expected:** The UI displays a secondary confirmation prompt before executing.

## 4. Acceptance Criteria

* **No Unhandled Errors:** All forbidden routes gracefully handle errors without crashing the application (no unexpected HTTP 500s).
* **Redirects:** Protected pages safely redirect unauthenticated users.
* **API Protection:** Unauthorized API actions return HTTP `401` or `403`.
* **UI State:** UI elements requiring permissions (e.g., "Import Cases", "Create User") do not render for unauthorized roles.
* **Backend Enforcement:** Bypassing the UI to call an API directly still correctly blocks unauthorized access.
* **No Secrets Exfiltration:** API error responses do not leak sensitive values, connection strings, or stack traces.
