# UAT Execution Results (Role-by-Role)

*Test Execution Type: Static Code Audit & Middleware Verification (Automated Agent)*
*Date: 2026-06-16*
*Status: Partially prepared/executed, not fully passed (Manual authentication with test accounts not performed).*

## Unauthenticated UAT
| Route | Expected Result | Actual Result | Pass/Fail | Notes | Enforcement Location |
|-------|-----------------|---------------|-----------|-------|----------------------|
| `/` | Redirect to login | Redirect | Pass | Verified via middleware | `src/middleware.ts` |
| `/login` | Render login | Render | Pass | Excluded from NextAuth | `src/middleware.ts` |
| `/api/auth/session` | Null/JSON | Handled | Pass | NextAuth standard | `src/middleware.ts` |
| Protected Pages | Redirect to login | Redirect | Pass | Blocked | `src/middleware.ts` |
| Protected APIs | 401 Unauthorized | 401 | Pass | Blocked | `src/middleware.ts` |

## Authenticated Role-by-Role UAT (Static Validation)

### 1. SYSTEM_ADMIN (Role: `ADMIN`)
* **Expected**: Full access to `/admin/system`, `/admin/users`, usage metrics, audit logs, and maintenance actions.
* **Actual**: `src/lib/auth/permissions.ts` grants all permissions to `ADMIN`. `requirePermission('VIEW_ADMIN_CONSOLE')` protects `/admin/system`.
* **Result**: Pass (Static).

### 2. CASE_MANAGER (Role: `COMMISSIONER`)
* **Expected**: Can access dashboard, cases, assignments, meetings. Cannot access admin.
* **Actual**: Granted `VIEW_DASHBOARD`, `VIEW_CASES`, `VIEW_ASSIGNMENTS`, `VIEW_MEETINGS`. Denied `VIEW_ADMIN_CONSOLE` and `MANAGE_USERS`.
* **Result**: Pass (Static).

### 3. DRAFTER (Role: `LEGAL_OFFICER`)
* **Expected**: Can edit drafts, use AI, upload documents. Cannot finalize or dispatch.
* **Actual**: Granted `EDIT_DRAFT`, `USE_AI_DRAFT`. Denied `FINALIZE_DECISION`, `MANAGE_DISPATCH_WORKFLOW`.
* **Result**: Pass (Static).

### 4. REVIEWER (Role: `COMMISSIONER`)
* **Expected**: Can access review areas, meetings, finalizations. Cannot dispatch.
* **Actual**: Granted `VIEW_POST_MEETING_FOLLOWUP`, `VERIFY_FINAL_READINESS`. Denied `MANAGE_DISPATCH_WORKFLOW`.
* **Result**: Pass (Static).

### 5. DISPATCH_OFFICER (Role: `REGISTRY_OFFICER`)
* **Expected**: Can access dispatch workflow. Cannot access admin or edit drafts.
* **Actual**: Granted `VIEW_DISPATCH_WORKFLOW`, `MANAGE_DISPATCH_WORKFLOW`. Denied `EDIT_DRAFT`, `VIEW_ADMIN_CONSOLE`.
* **Result**: Pass (Static).

### 6. EXECUTIVE_VIEWER (Role: `COMMISSIONER` or `VIEWER`)
* **Expected**: Read-only executive reports. No mutation.
* **Actual**: `VIEW_EXECUTIVE_DASHBOARD` and `EXPORT_EXECUTIVE_REPORT` granted to `COMMISSIONER`.
* **Result**: Pass (Static).

### 7. READ_ONLY_VIEWER (Role: `VIEWER`)
* **Expected**: Limited read-only view. No write access.
* **Actual**: Granted only `VIEW_*` permissions. Denied all `EDIT_*`, `MANAGE_*`, `USE_AI_*`.
* **Result**: Pass (Static).

## API Permission Challenge Tests (Static Verification)
* `/api/admin/users`: Protected by `requireApiPermission('MANAGE_USERS')`. Passes.
* `/api/admin/maintenance/actions`: Protected by explicit `hasPermission(user.role, def.requiredPermission)`. Passes.
* `/api/cases/[id]/finalization/red-number`: Protected by `hasPermission(user.role, 'RECORD_RED_CASE_NUMBER')`. Passes.
* `/api/cases/[id]/finalization/finalize`: Protected by `hasPermission(user.role, 'FINALIZE_DECISION')`. Passes.
* `/api/cases/[id]/documents/upload-placeholder`: Lacks granular permission check, but returns 501. Fails strictly, but safe.

**Conclusion**: The permission matrices and static routes align with the expected behavior. Broad unauthenticated access is completely mitigated by `src/middleware.ts`. Finer-grained RAG/Library authorization gaps were identified and logged to the gap register.
