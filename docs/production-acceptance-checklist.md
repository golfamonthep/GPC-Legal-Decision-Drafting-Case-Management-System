# Production Acceptance Checklist

This checklist must be executed before approving a production release to ensure that critical routes and APIs function as expected without exposing sensitive data or throwing errors.

## 1. Public / Auth Routes
- [ ] `/` - Renders without errors.
- [ ] `/login` - Renders without 500 errors.
- [ ] `/api/auth/session` - Returns a valid JSON response.
- [ ] Unauthenticated access to protected routes safely redirects to `/login` or returns an appropriate error (e.g., 401/403).

## 2. Core Workflow Routes
Test the following routes to ensure proper access controls:
- `/dashboard`
- `/cases`
- `/cases/[id]`
- `/cases/[id]/draft`
- `/search`
- `/finalization`
- `/dispatch`
- `/assignments`
- `/meetings`
- `/executive`
- `/data-quality`

**Expected Results:**
- [ ] Unauthenticated users are redirected.
- [ ] Authenticated and authorized users can access the routes.
- [ ] Unauthorized users are blocked appropriately.
- [ ] No 500 internal server errors occur.

## 3. Admin Routes
Test the following admin routes for restricted access and safe operations:
- `/admin/readiness`
- `/admin/system`
- `/admin/users`
- `/api/admin/system-health`
- `/api/admin/usage`
- `/api/admin/audit`
- `/api/admin/jobs`
- `/api/admin/security-signals`
- `/api/admin/maintenance/actions/metadata`

**Expected Results:**
- [ ] Admin-only access is enforced.
- [ ] No secret values (e.g., keys, tokens, connection strings) are exposed in the UI or API responses.
- [ ] Maintenance metadata is sanitized.
- [ ] POST maintenance actions correctly require elevated permissions and user confirmation.

## 4. Integration Routes
Test the integration health and status routes:
- `/api/health/db`
- `/api/integrations/microsoft/status`
- `/api/rag/qa`
- `/api/rag/retrieval`

**Expected Results:**
- [ ] Database health reports `ok` if configured.
- [ ] Microsoft integration status safely reports `configured` or `not_configured` without leaking credentials.
- [ ] RAG routes fail safely (e.g., return appropriate error messages or fallback states) if not configured.
- [ ] No secret values are exposed in the responses.
