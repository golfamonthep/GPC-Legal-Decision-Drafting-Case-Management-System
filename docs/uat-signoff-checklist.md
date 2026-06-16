# UAT Sign-Off Checklist
## GPC Legal Decision Drafting & Case Management System

**Version:** Prompt 47 Regression UAT
**Deployment Commit:** 82f2e37
**Date:** 2026-06-16

Legend: [x] = PASS, [ ] = NOT MET / BLOCKED, [~] = PARTIAL

---

## Auth / Session

- [x] /login renders without error (excluded from middleware)
- [x] /api/auth/session returns JSON (excluded from middleware)
- [x] Unauthenticated requests to protected pages redirect to /login via withAuth
- [ ] Login works with ADMIN test account (BLOCKED - no account)
- [ ] Session persists correctly after login (BLOCKED - no account)
- [ ] Inactive/disabled user is blocked by getCurrentUser status check (code verified)
- [x] NEXTAUTH_SECRET is not committed to repository

---

## DB Health

- [x] /api/health/db returns status ok
- [x] databaseConfigured: true
- [x] canConnect: true
- [x] DATABASE_URL not hardcoded in source
- [x] Prisma client generates correctly (src/generated/prisma)

---

## Core Workflow Access

- [x] /dashboard protected by requirePermission('VIEW_DASHBOARD') - static
- [x] /cases protected by requirePermission('VIEW_CASES') - static
- [x] /cases/[id] protected by requirePermission('VIEW_CASE_DETAIL') - static
- [x] /search protected by requirePermission('ADVANCED_CASE_SEARCH') - static
- [ ] COMMISSIONER can access /cases (BLOCKED - no account)
- [ ] VIEWER can access /cases (BLOCKED - no account)
- [ ] VIEWER cannot access /search (BLOCKED - no account)

---

## Drafting Workflow

- [x] /cases/[id]/draft protected by requirePermission('VIEW_DRAFT') - static
- [x] /api/draft/check-citations protected by requireApiPermission('USE_AI_REVIEW') - static
- [x] /api/draft/review-wording protected by requireApiPermission('USE_AI_REVIEW') - static
- [x] /api/draft/section-ai protected by requireApiPermission('USE_AI_DRAFT') - static
- [x] /api/cases/[id]/export-docx protected by requireApiPermission('EXPORT_DOCX') - static
- [ ] LEGAL_OFFICER can use AI draft tools (BLOCKED - no account)
- [ ] REGISTRY_OFFICER cannot access /cases/[id]/draft (BLOCKED - no account)
- [ ] VIEWER cannot use AI review (BLOCKED - no account)

---

## Finalization Workflow

- [x] /finalization protected by hasPermission('VIEW_POST_MEETING_FOLLOWUP') - static
- [x] /api/cases/[id]/finalization (POST) protected by hasPermission('MANAGE_POST_MEETING_FOLLOWUP') - static
- [x] /api/cases/[id]/finalization/finalize protected by hasPermission('FINALIZE_DECISION') - static
- [x] /api/cases/[id]/finalization/revision protected by hasPermission('MARK_DRAFT_REVISED') - static
- [x] /api/cases/[id]/finalization/close protected by hasPermission('CLOSE_CASE_AFTER_DECISION') - static
- [x] /api/cases/[id]/finalization/red-number protected by hasPermission('RECORD_RED_CASE_NUMBER') - static
- [ ] COMMISSIONER can view finalization (BLOCKED - no account)
- [ ] VIEWER cannot access finalization (BLOCKED - no account)
- [ ] FINALIZE_DECISION check rejects COMMISSIONER at API level (BLOCKED - no account)

---

## Dispatch Workflow

- [x] /dispatch protected by requirePermission('VIEW_DISPATCH_WORKFLOW') - static
- [x] /api/cases/[id]/assignment protected by requireApiPermission('ASSIGN_CASES') - static
- [x] /api/assignments/bulk protected by requireApiPermission('ASSIGN_CASES') - static
- [x] /registry/import protected by requirePermission('IMPORT_REGISTRY') - static
- [x] /api/registry/import protected by requireApiPermission('IMPORT_REGISTRY') - static
- [ ] REGISTRY_OFFICER can access /dispatch (BLOCKED - no account)
- [ ] LEGAL_OFFICER cannot access /registry/import (BLOCKED - no account)

---

## RAG / Library

- [x] /library server page protected by requirePermission('VIEW_RECORDS_ARCHIVE') - static (added Prompt 46)
- [x] /api/rag/qa protected by requireApiPermission('USE_AI_REVIEW') - static (added Prompt 46)
- [x] /api/rag/retrieval protected by requireApiPermission('USE_AI_REVIEW') - static (added Prompt 46)
- [x] requireApiPermission throws UNAUTHORIZED/FORBIDDEN; caught correctly with 401/403 response
- [~] /rag page: withAuth only (no requirePermission) - PARTIAL
- [~] /legal-qa page: withAuth only (no requirePermission); API protected - PARTIAL
- [~] /rag/retrieval-test page: withAuth only - PARTIAL
- [ ] REGISTRY_OFFICER cannot use RAG QA API (BLOCKED - no account)
- [ ] VIEWER cannot access /library (BLOCKED - no account)

---

## Admin / System

- [x] /admin/system protected by requirePermission('VIEW_ADMIN_CONSOLE') - static
- [x] /admin/readiness protected by requirePermission('MANAGE_USERS') - static
- [x] /api/admin/system-health protected by requireApiPermission('VIEW_ADMIN_CONSOLE') - static
- [x] /api/admin/usage protected by requireApiPermission('VIEW_ADMIN_CONSOLE') - static
- [x] /api/admin/audit protected by requireApiPermission('VIEW_ADMIN_CONSOLE') - static
- [x] /api/admin/jobs protected by requireApiPermission('VIEW_ADMIN_CONSOLE') - static
- [x] /api/admin/security-signals protected by requireApiPermission('VIEW_ADMIN_CONSOLE') - static
- [x] /api/admin/users protected by requireApiPermission('MANAGE_USERS') - static
- [ ] ADMIN can access /admin/system (BLOCKED - no account)
- [ ] COMMISSIONER is denied /admin/system (BLOCKED - no account)

---

## Maintenance Actions

- [x] /api/admin/maintenance/actions only accepts POST (GET returns 405) - static
- [x] Null user returns 401 - static
- [x] Per-action hasPermission check enforced - static
- [x] Unknown actionId returns 400 - static
- [x] dryRun defaults to true - static
- [x] Risky actions require exact confirmation phrase - static
- [x] Metadata response contains no secrets or connection strings - static
- [x] Actions do not execute during page render or module import - static
- [ ] Admin can trigger dry-run maintenance action (BLOCKED - no account)
- [ ] Confirmation phrase mismatch returns 400 (BLOCKED - no account)

---

## Permission Gaps

- [x] GAP-001 fixed: /api/rag/qa, /api/rag/retrieval now use requireApiPermission
- [~] GAP-002 partial: /library fixed; /rag and /legal-qa pages deferred
- [x] GAP-003 deferred: upload-placeholder returns 501 (safe)
- [x] GAP-004 verified: all finalization routes already protected

---

## Logs / Audit

- [x] Audit logs written for maintenance actions (before/after or result)
- [x] AI draft section actions create audit logs
- [x] Finalization override uses audit log
- [x] Audit logs accessible via /api/admin/audit (admin only)
- [ ] Audit entries created correctly during live testing (BLOCKED - no account)

---

## Rollback Readiness

- [x] Stable tag stable-post-prompt-42c exists
- [x] All changes in clean commits on main branch
- [x] No migration changes needed for this sprint
- [x] Rollback procedure documented in OPERATIONS_RUNBOOK.md

---

## Secret Rotation Status

- [x] No secrets found in tracked files or git history (checked in Prompt 46 and 47)
- [x] NEXTAUTH_SECRET not in source code
- [x] DATABASE_URL not hardcoded (only documentation patterns)
- [x] No rotation required (no exposure detected)
