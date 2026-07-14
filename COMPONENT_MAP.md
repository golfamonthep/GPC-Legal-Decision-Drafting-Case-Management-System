# COMPONENT_MAP.md — GPC Legal Decision Drafting & Case Management System

> **Mandatory Read-First Rule**: All future prompts must read this file when adding or modifying
> routes, components, or API handlers. Update this file after any structural changes.

---

## 1. Route Groups Overview

| Group | Page Routes | API Routes | Required Permission |
|-------|-------------|-----------|---------------------|
| Auth/Public | `/login` | `/api/auth/[...nextauth]`, `/api/health/db` | None (public) |
| Dashboard | `/dashboard` | — | `VIEW_DASHBOARD` |
| Cases | `/cases`, `/cases/[id]`, `/cases/[id]/draft` | Multiple `/api/cases/*` | `VIEW_CASES` etc. |
| Registry | `/registry`, `/registry/import` | `/api/registry/import` | `IMPORT_REGISTRY` |
| Drafting | `/cases/[id]/draft` | `/api/draft/*` | `VIEW_DRAFT`, `EDIT_DRAFT`, `USE_AI_DRAFT` |
| Finalization | `/finalization` | `/api/cases/[id]/finalization/*` | `VERIFY_FINAL_READINESS` etc. |
| Dispatch | `/dispatch` | — | `VIEW_DISPATCH_WORKFLOW` |
| Assignments | `/assignments` | `/api/assignments/*` | `VIEW_ASSIGNMENTS` |
| Meetings | `/meetings`, `/meetings/new`, `/meetings/[id]` | `/api/meetings/*` | `VIEW_MEETINGS` |
| Search/Intelligence | `/search`, `/case-intelligence` | `/api/search/cases/export` | `ADVANCED_CASE_SEARCH` |
| Executive/Reports | `/executive` | `/api/reports/executive/export` | `VIEW_EXECUTIVE_DASHBOARD` |
| Data Quality | `/data-quality` | `/api/data-quality/*` | `VIEW_DATA_QUALITY` |
| Library/RAG | `/library`, `/library/[id]/chunks`, `/rag`, `/rag/retrieval-test`, `/legal-qa` | `/api/rag/*` | `VIEW_DRAFT` / requires auth |
| Admin/System | `/admin/system`, `/admin/users`, `/admin/readiness`, `/admin/permissions` | `/api/admin/*` | `VIEW_ADMIN_CONSOLE` |
| Maintenance Actions | (within `/admin/system`) | `/api/admin/maintenance/actions` | `MANAGE_SYSTEM_SETTINGS` |
| Records Retention | `/records-retention` | — (server-fetched) | `VIEW_RECORDS_ARCHIVE` |
| Health/Integrations | — | `/api/health/db`, `/api/integrations/microsoft/status` | Public / `VIEW_INTEGRATION_STATUS` |

---

## 2. App Page Routes

### Auth / Public
| Route | File | Notes |
|-------|------|-------|
| `/` | `src/app/page.tsx` | Root redirect (→ /dashboard) |
| `/login` | `src/app/login/page.tsx` | NextAuth sign-in page; Azure AD |

### Dashboard
| Route | File | Key Components | Permission |
|-------|------|----------------|------------|
| `/dashboard` | `src/app/dashboard/page.tsx` | `DashboardCard`, `Sidebar`, `TopHeader` | `VIEW_DASHBOARD` |

### Cases
| Route | File | Key Components | Permission |
|-------|------|----------------|------------|
| `/cases` | `src/app/cases/page.tsx` | `CaseTable`, `CaseListFilters`, `StatusBadge` | `VIEW_CASES` |
| `/cases/[id]` | `src/app/cases/[id]/page.tsx` | `CaseDetailActions`, `DocumentList`, `Timeline`, `CaseAssignmentPanel`, `DispatchPanel` | `VIEW_CASE_DETAIL` |
| `/cases/[id]/draft` | `src/app/cases/[id]/draft/page.tsx` | Draft sections, AI draft panel | `VIEW_DRAFT` |

### Registry
| Route | File | Key Components | Permission |
|-------|------|----------------|------------|
| `/registry` | `src/app/registry/page.tsx` | `RegistryTable`, `RegistryFilters` | `VIEW_CASES` |
| `/registry/import` | `src/app/registry/import/page.tsx` | `ImportExcel` component | `IMPORT_REGISTRY` |

### Finalization
| Route | File | Permission |
|-------|------|------------|
| `/finalization` | `src/app/finalization/page.tsx` | `VERIFY_FINAL_READINESS` |

### Dispatch
| Route | File | Permission |
|-------|------|------------|
| `/dispatch` | `src/app/dispatch/page.tsx` | `VIEW_DISPATCH_WORKFLOW` |

### Assignments
| Route | File | Key Components | Permission |
|-------|------|----------------|------------|
| `/assignments` | `src/app/assignments/page.tsx` | `CaseAssignmentPanel` | `VIEW_ASSIGNMENTS` |

### Meetings
| Route | File | Key Components | Permission |
|-------|------|----------------|------------|
| `/meetings` | `src/app/meetings/page.tsx` | Meeting list | `VIEW_MEETINGS` |
| `/meetings/new` | `src/app/meetings/new/page.tsx` | Meeting creation form | `MANAGE_MEETINGS` |
| `/meetings/[id]` | `src/app/meetings/[id]/page.tsx` | `PostMeetingPanel` | `VIEW_MEETINGS` |

### Search / Intelligence
| Route | File | Permission |
|-------|------|------------|
| `/search` | `src/app/search/page.tsx` | `ADVANCED_CASE_SEARCH` |
| `/case-intelligence` | `src/app/case-intelligence/page.tsx` | `ADVANCED_CASE_SEARCH` |

### Executive
| Route | File | Permission |
|-------|------|------------|
| `/executive` | `src/app/executive/page.tsx` | `VIEW_EXECUTIVE_DASHBOARD` |

### Data Quality
| Route | File | Permission |
|-------|------|------------|
| `/data-quality` | `src/app/data-quality/page.tsx` | `VIEW_DATA_QUALITY` |

### Library / RAG / Legal Q&A
| Route | File | Permission |
|-------|------|------------|
| `/library` | `src/app/library/page.tsx` | `VIEW_DRAFT` (server-checked) |
| `/library/[id]/chunks` | `src/app/library/[id]/chunks/page.tsx` | Requires auth |
| `/rag` | `src/app/rag/page.tsx` | `USE_AI_DRAFT` (requires verification) |
| `/rag/retrieval-test` | `src/app/rag/retrieval-test/page.tsx` | Requires auth |
| `/legal-qa` | `src/app/legal-qa/page.tsx` | Requires auth |

### Admin / System
| Route | File | Permission |
|-------|------|------------|
| `/admin/system` | `src/app/admin/system/page.tsx` | `VIEW_ADMIN_CONSOLE` |
| `/admin/users` | `src/app/admin/users/page.tsx` | `MANAGE_USERS` |
| `/admin/readiness` | `src/app/admin/readiness/page.tsx` | `VIEW_ADMIN_CONSOLE` |
| `/admin/permissions` | `src/app/admin/permissions/page.tsx` | `VIEW_ADMIN_CONSOLE` |

### Records Retention
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/records-retention` | `src/app/records-retention/page.tsx` | GET | `VIEW_RECORDS_ARCHIVE` |
| `/api/records-retention/archive/preview` | route.ts | POST | `PREVIEW_ARCHIVE` |
| `/api/records-retention/archive/execute` | route.ts | POST | `ARCHIVE_CASE` |
| `/api/records-retention/archive/environment` | route.ts | GET | `PREVIEW_ARCHIVE` |

### Integrations / Document Sync
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/document-sync` | `src/app/document-sync/page.tsx` | GET | `VIEW_DOCUMENT_SYNC` |

---

## 3. API Routes

### Auth / Health
| Route | File | Method | Permission | Notes |
|-------|------|--------|------------|-------|
| `/api/auth/[...nextauth]` | `src/app/api/auth/[...nextauth]/route.ts` | GET/POST | Public | NextAuth handler |
| `/api/health/db` | `src/app/api/health/db/route.ts` | GET | Public | DB health check |
| `/api/integrations/microsoft/status` | `src/app/api/integrations/microsoft/status/route.ts` | GET | `VIEW_INTEGRATION_STATUS` | MS Graph status |
| `/api/document-sync/microsoft/status` | `src/app/api/document-sync/microsoft/status/route.ts` | GET | `VIEW_DOCUMENT_SYNC` | Status for mock sync |
| `/api/document-sync/microsoft/preview` | `src/app/api/document-sync/microsoft/preview/route.ts` | POST | `PREVIEW_DOCUMENT_SYNC` | Preview for mock sync |

### Cases
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/cases/[id]/assignment` | route.ts | GET/PATCH | `VIEW_CASE_DETAIL` / `ASSIGN_CASES` |
| `/api/cases/[id]/documents` | route.ts | GET/POST | `VIEW_DOCUMENTS` / `LINK_DOCUMENTS` |
| `/api/cases/[id]/documents/upload-placeholder` | route.ts | POST | `UPLOAD_DOCUMENTS` |
| `/api/cases/[id]/export-docx` | route.ts | POST | `EXPORT_DOCX` |
| `/api/cases/[id]/export-final-docx` | route.ts | POST | `EXPORT_FINAL_DECISION_DOCX` |
| `/api/cases/[id]/finalization` | route.ts | GET/PATCH | `VERIFY_FINAL_READINESS` |
| `/api/cases/[id]/finalization/close` | route.ts | POST | `CLOSE_CASE_AFTER_DECISION` |
| `/api/cases/[id]/finalization/finalize` | route.ts | POST | `FINALIZE_DECISION` |
| `/api/cases/[id]/finalization/red-number` | route.ts | POST | `RECORD_RED_CASE_NUMBER` |
| `/api/cases/[id]/finalization/revision` | route.ts | POST | `MARK_DRAFT_REVISION_REQUIRED` |

### Registry
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/registry/import` | route.ts | POST | `IMPORT_REGISTRY` |

### Draft / AI
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/draft/section-ai` | route.ts | POST | `USE_AI_DRAFT` |
| `/api/draft/review-wording` | route.ts | POST | `USE_AI_REVIEW` |
| `/api/draft/check-citations` | route.ts | POST | `VIEW_DRAFT` |

### Assignments
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/assignments` | route.ts | GET/POST | `VIEW_ASSIGNMENTS` / `ASSIGN_CASES` |
| `/api/assignments/bulk` | route.ts | POST | `ASSIGN_CASES` |
| `/api/assignments/export` | route.ts | GET | `EXPORT_WORKLOAD_REPORT` |

### Meetings
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/meetings` | route.ts | GET/POST | `VIEW_MEETINGS` / `MANAGE_MEETINGS` |
| `/api/meetings/[id]` | route.ts | GET/PATCH/DELETE | `VIEW_MEETINGS` / `MANAGE_MEETINGS` |
| `/api/meetings/[id]/agenda` | route.ts | GET/POST/PATCH | `VIEW_MEETINGS` / `ADD_CASE_TO_MEETING` |

### RAG / Legal Q&A
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/rag/qa` | route.ts | POST | Requires auth + permission (hardened in Prompt 46) |
| `/api/rag/retrieval` | route.ts | POST | Requires auth + permission (hardened in Prompt 46) |

### Executive / Reports
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/reports/executive/export` | route.ts | GET | `EXPORT_EXECUTIVE_REPORT` |

### Search
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/search/cases/export` | route.ts | GET | `EXPORT_SEARCH_RESULTS` |

### Data Quality
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/data-quality/issues` | route.ts | GET | `VIEW_DATA_QUALITY` |
| `/api/data-quality/export` | route.ts | GET | `EXPORT_DATA_QUALITY_REPORT` |
| `/api/data-quality/cases/[id]/quick-fix` | route.ts | POST | `CLEANUP_DATA_QUALITY` |

### Admin / System
| Route | File | Method | Permission |
|-------|------|--------|------------|
| `/api/admin/audit` | route.ts | GET | `VIEW_AUDIT_LOGS` |
| `/api/admin/jobs` | route.ts | GET | `VIEW_RAG_JOBS` |
| `/api/admin/security-signals` | route.ts | GET | `VIEW_SECURITY_MONITORING` |
| `/api/admin/system-health` | route.ts | GET | `VIEW_SYSTEM_HEALTH` |
| `/api/admin/usage` | route.ts | GET | `VIEW_USAGE_METRICS` |
| `/api/admin/users` | route.ts | GET/POST | `MANAGE_USERS` |
| `/api/admin/users/[id]` | route.ts | GET/PATCH/DELETE | `MANAGE_USERS` |

### Maintenance Actions
| Route | File | Method | Permission | Notes |
|-------|------|--------|------------|-------|
| `/api/admin/maintenance/actions` | route.ts | GET/POST | `MANAGE_SYSTEM_SETTINGS` | POST-only for mutations; GET for dry-run |
| `/api/admin/maintenance/actions/metadata` | route.ts | GET | `VIEW_ADMIN_CONSOLE` | Returns action definitions |

---

## 4. Key Components

| Component | File | Used In |
|-----------|------|---------|
| `Sidebar` | `src/components/Sidebar.tsx` | All authenticated pages via layout |
| `TopHeader` | `src/components/TopHeader.tsx` | All authenticated pages via layout |
| `UserMenu` | `src/components/UserMenu.tsx` | TopHeader |
| `DashboardCard` | `src/components/DashboardCard.tsx` | `/dashboard` |
| `CaseTable` | `src/components/CaseTable.tsx` | `/cases` |
| `CaseListFilters` | `src/components/CaseListFilters.tsx` | `/cases` |
| `StatusBadge` | `src/components/StatusBadge.tsx` | Case lists, case detail |
| `Timeline` | `src/components/Timeline.tsx` | `/cases/[id]` |
| `CaseDetailActions` | `src/components/CaseDetailActions.tsx` | `/cases/[id]` |
| `CaseAssignmentPanel` | `src/components/CaseAssignmentPanel.tsx` | `/cases/[id]`, `/assignments` |
| `DocumentList` | `src/components/DocumentList.tsx` | `/cases/[id]` |
| `DocumentLinkModal` | `src/components/DocumentLinkModal.tsx` | `/cases/[id]` |
| `EditCaseModal` | `src/components/EditCaseModal.tsx` | `/cases/[id]` |
| `DispatchPanel` | `src/components/DispatchPanel.tsx` | `/cases/[id]`, `/dispatch` |
| `PostMeetingPanel` | `src/components/PostMeetingPanel.tsx` | `/meetings/[id]` |
| `RegistryTable` | `src/components/RegistryTable.tsx` | `/registry` |
| `RegistryFilters` | `src/components/RegistryFilters.tsx` | `/registry` |
| `ImportExcel` | `src/components/ImportExcel/` | `/registry/import` |
| `MaintenanceActionsPanel` | `src/components/admin/MaintenanceActionsPanel.tsx` | `/admin/system` |
| `ArchivePreviewPanel` | `src/components/records-retention/ArchivePreviewPanel.tsx` | `/records-retention` (contains preview and execution state machine) |

---

## 5. Key Lib / Service Modules

| Module | Path | Purpose |
|--------|------|---------|
| `db.ts` | `src/lib/db.ts` | Prisma client singleton |
| `permissions.ts` | `src/lib/auth/permissions.ts` | `PERMISSIONS`, `ROLE_PERMISSIONS`, `hasPermission()` |
| `authOptions.ts` | `src/lib/auth/authOptions.ts` | NextAuth configuration (Azure AD provider) |
| `currentUser.ts` | `src/lib/auth/currentUser.ts` | `getCurrentUser()` — reads session from NextAuth |
| `requireApiPermission.ts` | `src/lib/auth/requireApiPermission.ts` | `requireApiPermission(permission)` — throws UNAUTHORIZED/FORBIDDEN |
| `requirePermission.ts` | `src/lib/auth/requirePermission.ts` | Server component permission guard |
| `audit.ts` | `src/lib/audit.ts` | Audit log write helper |
| `caseStatus.ts` | `src/lib/caseStatus.ts` | Case status transitions and labels |
| `chunking.ts` | `src/lib/chunking.ts` | Document text chunking for RAG |
| `dateUtils.ts` | `src/lib/dateUtils.ts` | Thai date formatting utilities |
| RAG modules | `src/lib/rag/` | Retrieval, embedding, Q&A orchestration |
| AI modules | `src/lib/ai/` | OpenAI API wrappers |
| Export modules | `src/lib/export/` | DOCX and XLSX export |
| Microsoft modules | `src/lib/microsoft/` | Microsoft Graph integration helpers |
| Finalization lib | `src/lib/finalization/` | Finalization workflow logic |
| Dispatch lib | `src/lib/dispatch/` | Dispatch workflow logic |
| Meetings lib | `src/lib/meetings/` | Meeting management logic |
| Assignments lib | `src/lib/assignments/` | Assignment logic |
| Reports lib | `src/lib/reports/` | Executive report generation |
| Search lib | `src/lib/search/` | Case search implementation |
| Data quality lib | `src/lib/dataQuality/` | Issue detection and fix logic |
| Admin lib | `src/lib/admin/` | System health, usage, audit queries |
| Records Retention | `src/lib/records-retention/` | `retentionQueries.ts`, `archivePreview.ts`, `archiveExecution.ts`, `archiveEnvironmentGate.ts` |
| Microsoft Graph Sync | `src/lib/microsoft-graph/` | `config.ts`, `types.ts`, `client.ts`, `mock.ts` |

---

## 6. Auth / Permission Guard Map

| Guard | Location | Scope | Behavior |
|-------|----------|-------|----------|
| `withAuth` (NextAuth middleware) | `src/middleware.ts` | All routes except public | Redirects to `/login` if no session |
| `requireApiPermission(perm)` | API route handlers | API routes with mutations | Throws `UNAUTHORIZED`/`FORBIDDEN`; caller must catch → 401/403 |
| `requirePermission(perm)` | Server components | Page-level permission check | Returns 403 page or redirects |
| `hasPermission(role, perm)` | `src/lib/auth/permissions.ts` | Any code | Returns boolean; no side effects |

### Critical: requireApiPermission usage pattern
```typescript
// CORRECT
export async function POST(req: Request) {
  try {
    const user = await requireApiPermission('EDIT_CASE');
    // ... handler logic
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 7. Middleware Configuration

```typescript
// src/middleware.ts
// Protected: all routes EXCEPT:
// - /login
// - /api/auth/*
// - /api/health/*
// - _next/static, _next/image, favicon.ico
```

Public routes (no session required):
- `/login`
- `/api/auth/*` (NextAuth endpoints)
- `/api/health/db`

---

## 8. Admin / System Console Map

| Feature | Page | API | Permission |
|---------|------|-----|------------|
| System health overview | `/admin/system` | `/api/admin/system-health` | `VIEW_SYSTEM_HEALTH` |
| User management | `/admin/users` | `/api/admin/users`, `/api/admin/users/[id]` | `MANAGE_USERS` |
| Audit logs viewer | `/admin/system` | `/api/admin/audit` | `VIEW_AUDIT_LOGS` |
| RAG jobs monitor | `/admin/system` | `/api/admin/jobs` | `VIEW_RAG_JOBS` |
| Security signals | `/admin/system` | `/api/admin/security-signals` | `VIEW_SECURITY_MONITORING` |
| Usage metrics | `/admin/system` | `/api/admin/usage` | `VIEW_USAGE_METRICS` |
| Permissions inspector | `/admin/permissions` | — | `VIEW_ADMIN_CONSOLE` |
| Production readiness | `/admin/readiness` | — | `VIEW_ADMIN_CONSOLE` |
| Maintenance actions | `/admin/system` | `/api/admin/maintenance/actions` | `MANAGE_SYSTEM_SETTINGS` |

---

## 9. Maintenance Actions Map

Component: [`MaintenanceActionsPanel.tsx`](file:///c:/APP/src/components/admin/MaintenanceActionsPanel.tsx)

| Action | HTTP | Permission | Confirmation Required | Audit Logged |
|--------|------|------------|----------------------|--------------|
| Orphan chunk cleanup | POST | `MANAGE_SYSTEM_SETTINGS` | Yes (phrase input) | Yes |
| Stale job cleanup | POST | `MANAGE_SYSTEM_SETTINGS` | Yes (phrase input) | Yes |
| Dry-run (preview) | GET | `VIEW_ADMIN_CONSOLE` | No | No |

**Rules**:
- All mutation actions are POST-only.
- Confirmation phrase required for destructive actions.
- Every action is audit-logged with user ID, action type, and result.
- Actions must never execute during page render or module import.

---

## 10. RAG / Library Map

| Feature | Page/API | Lib Module | Notes |
|---------|----------|-----------|-------|
| Library browser | `/library` | — | Requires `VIEW_DRAFT` (server-checked) |
| Chunk viewer | `/library/[id]/chunks` | — | Requires auth |
| RAG ingestion | `/rag` | `src/lib/rag/` | Requires permission (verify) |
| Retrieval test | `/rag/retrieval-test` | `src/lib/rag/` | Requires auth |
| Legal Q&A | `/legal-qa` | `src/lib/rag/`, `src/lib/ai/` | Requires auth |
| RAG Q&A API | `/api/rag/qa` | `src/lib/rag/`, `src/lib/ai/` | Protected (hardened Prompt 46) |
| RAG retrieval API | `/api/rag/retrieval` | `src/lib/rag/` | Protected (hardened Prompt 46) |

---

## 11. Known Sensitive Routes

| Route | Sensitivity | Notes |
|-------|-------------|-------|
| `/api/rag/qa` | High | AI with legal content; requires permission |
| `/api/rag/retrieval` | High | Knowledge base access; requires permission |
| `/api/admin/maintenance/actions` | Critical | Destructive operations; POST + permission + confirmation |
| `/api/admin/users` | High | User management |
| `/api/cases/[id]/finalization/finalize` | High | Irreversible case finalization |
| `/api/cases/[id]/finalization/close` | High | Case closure |
| `/api/registry/import` | Medium | Bulk data import |

---

## 12. Where to Update When Adding New Features

| Change Type | Files to Update |
|-------------|----------------|
| New page route | Add to this file (COMPONENT_MAP.md) §2 |
| New API route | Add to this file §3; check permission in SKILL.md §17 |
| New component | Add to this file §4 |
| New lib module | Add to this file §5 |
| New permission | Update `src/lib/auth/permissions.ts`; update DATABASE_SCHEMA.md if needed |
| Schema change | Update DATABASE_SCHEMA.md; create migration; update this file if model referenced |
| New module | Update ARCHITECTURE.md §3; update PROJECT_STATE.md §4 |
| Completed prompt | Update PROJECT_STATE.md §3, §4, §7 |

---

## 13. Scripts & Automation

| Script / Doc | Path | Purpose |
|--------------|------|---------|
| Pilot Seed Script | `scripts/seed-pilot-data.ts` | Safely seeds pilot test cases and users |
| Pilot Seed PS1 | `scripts/pilot-seed.ps1` | PowerShell wrapper to execute seed-pilot-data |
| Pilot Seed Check | `scripts/pilot-seed-check.ps1` | Validates presence of pilot seed docs and scripts |
| Pilot Trial Plan | `docs/pilot-data-trial-plan.md` | Strategic plan for pilot trial execution |
| Pilot Workflow Checklist | `docs/pilot-workflow-checklist.md` | Checklist of end-to-end UAT checks for pilot (Coverage includes `/cases`, `/finalization`, `/search`, etc.) |
| Controlled Trial Protocol | `docs/controlled-real-case-trial-protocol.md` | Guidelines on using real cases in trial |
| Cleanup Strategy | `docs/pilot-data-cleanup-strategy.md` | Strategy for removing pilot data safely |
| Archive Execution Docs | `docs/archive-execution-readiness-decision.md`, `docs/archive-execution-migration-plan.md`, `docs/archive-execution-permission-plan.md`, `docs/archive-execution-implementation-roadmap.md`, `docs/archive-execution-ui-state-machine.md`, `docs/archive-execution-uat-report.md`, `docs/archive-execution-audit-verification.md`, `docs/archive-reversal-verification-report.md` | Comprehensive readiness evaluation and implementation plans for safe archive execution, including Prompt 59 UAT and verification reports. |
| Production Archive Release Docs | `docs/production-archive-release-gate.md`, `docs/archive-operator-sop.md`, `docs/archive-production-rollback-reversal-plan.md`, `docs/archive-production-monitoring-plan.md`, `docs/archive-production-approval-form.md`, `docs/archive-first-production-run-checklist.md`, `docs/production-archive-environment-gate-review.md` | **NEW (Prompt 60)** Release gate, SOP, monitoring, rollback, and approval forms for production archive execution (Currently NO-GO). |
| Archive Schema Docs | `docs/archive-retention-schema-implementation-notes.md`, `docs/archive-retention-migration-manual-plan.md` | Implementation notes and manual migration plan for archive database schema support. |
| Permission Smoke Script | `scripts/records-retention-permission-smoke.ps1` | Unauthenticated smoke test for the Records Retention page and API guards. |
| Archive UI Smoke Script | `scripts/archive-execution-ui-smoke.ps1` | Unauthenticated smoke test for the Archive Execution UI and environment API. |
| Dry-Run Execution Report | - `docs/pilot-seeding-dry-run-results.md` - Validation results for pilot dry-run (Prompt 50A)<br>- `docs/incident-response-runbook.md` - Remediation steps for common project incidents<br>- `docs/records-retention-uat-results.md` - UAT results for Records Retention UI (Prompt 52)<br>- `docs/archive-action-design.md` - Design document for future archive workflows (Prompt 52)<br>- `docs/archive-action-api-contract.md` - API contract for the future POST archive endpoint<br>- `docs/archive-action-ui-flow.md` - Planned UI flow for case archiving<br>- `docs/archive-eligibility-rules.md` - Business rules for case archive eligibility |
| Pilot Seed Validation Report | `docs/pilot-seed-validation-report.md` | Output report from actual staging/preview seed execution |
| **Preview/Staging Pilot Execution Report** | `docs/preview-staging-pilot-execution-report.md` | **NEW (Prompt 50)** Full execution report including environment check, role account status, workflow pass/fail, and GO/NO-GO decision |
| **Staging Environment Verification Script** | `scripts/verify-staging-environment.ps1` | **NEW (Prompt 61A/61B)** Validates endpoints on staging safely (Skipped in 61B due to unconfirmed environment) |
| **Archive Pilot Seed Script** | `scripts/seed-archive-pilot-records.ts` | **NEW (Prompt 61A/61B)** Seeds safe mock cases for archive UAT (Execution blocked in 61B) |
| **Archive Pilot Plan & Roles** | `docs/archive-pilot-records-plan.md`, `docs/archive-staging-role-account-checklist.md`, `docs/staging-archive-readiness-report.md` | **NEW (Prompt 61A/61B)** Comprehensive plans for staging tests (Updated in 61B for owner confirmation gate) |
| **Microsoft Graph Sync Docs** | `docs/microsoft-graph-document-sync-foundation.md`, `docs/microsoft-graph-live-auth-readiness-report.md`, `docs/microsoft-graph-live-permission-checklist.md`, `docs/microsoft-graph-env-checklist.md`, `docs/microsoft-graph-sync-uat-checklist.md`, `docs/microsoft-graph-staging-connectivity-test-runbook.md` | **NEW (Prompt 63)** Foundation and staging connectivity test readiness docs |
| **Microsoft Graph Metadata Dry Run Docs** | `docs/microsoft-graph-metadata-dry-run-report.md`, `docs/microsoft-graph-metadata-normalization-contract.md`, `docs/microsoft-graph-metadata-dry-run-runbook.md` | **NEW (Prompt 64)** Metadata dry run readiness and rules |

*Note: The metadata dry-run service (`src/lib/microsoft-graph/metadataDryRun.ts`), API route (`/api/document-sync/microsoft/metadata-dry-run`), UI dry-run panel, and smoke script (`scripts/test-microsoft-graph-metadata-dry-run.ps1`) are planned but currently **BLOCKED** pending owner confirmation.*

---

## Prompt 50 — Pilot Workflow Route Coverage (Static Audit)

All routes below were verified as build-successful and structurally permission-protected. Live authenticated tests are blocked pending environment confirmation.

| Phase | Routes Audited | Static Audit | Live Test |
|-------|---------------|-------------|-----------|
| Case Registry | `/cases`, `/cases/[id]`, `/registry`, `/api/registry/import` | ✅ | ❌ Blocked |
| Assignment | `/assignments`, `/api/assignments`, `/api/cases/[id]/assignment`, `/api/assignments/bulk` | ✅ | ❌ Blocked |
| Drafting | `/cases/[id]/draft`, `/api/draft/*`, `/api/cases/[id]/export-docx` | ✅ | ❌ Blocked |
| Finalization | `/finalization`, `/api/cases/[id]/finalization/*`, `/api/cases/[id]/export-final-docx` | ✅ | ❌ Blocked |
| Dispatch | `/dispatch`, `/api/cases/[id]/documents`, `/api/cases/[id]/documents/upload-placeholder` | ✅ | ❌ Blocked |
| Meetings | `/meetings`, `/meetings/new`, `/meetings/[id]`, `/api/meetings`, `/api/meetings/[id]/agenda` | ✅ | ❌ Blocked |
| Search/Reports | `/search`, `/case-intelligence`, `/executive`, `/api/search/cases/export`, `/api/reports/executive/export` | ✅ | ❌ Blocked |
| Data Quality | `/data-quality`, `/api/data-quality/issues`, `/api/data-quality/export`, `/api/data-quality/cases/[id]/quick-fix` | ✅ | ❌ Blocked |
| Library/RAG | `/library`, `/rag`, `/rag/retrieval-test`, `/legal-qa`, `/api/rag/qa`, `/api/rag/retrieval` | ✅ | ❌ Blocked |
| Admin/Maintenance | `/admin/readiness`, `/admin/system`, `/admin/users`, `/api/admin/*`, `/api/admin/maintenance/actions` | ✅ | ❌ Blocked |
| Records Retention (Prompt 59) | `/records-retention`, `/api/records-retention/archive/preview`, `/api/records-retention/archive/execute`, `/api/records-retention/archive/environment` | ✅ | ❌ Blocked (Environment/Accounts) |

### Known Weak Spots (Post Prompt 59)

| Spot | Route | Issue | Priority |
|------|-------|-------|----------|
| Upload permission | `/api/cases/[id]/documents/upload-placeholder` | Missing `UPLOAD_DOCUMENTS` check (GAP-003, deferred) | Medium |
| RAG page auth | `/rag/retrieval-test`, `/legal-qa` | Only partially hardened (GAP-002) | Medium |
| Middleware deprecation | `next.config.ts` | `"middleware"` should be `"proxy"` (Next.js 16 deprecation warning) | Low |

---

## Prompt 50B — Staging Verification Docs and Seed Flow

### New Documents Created

| Document | Path | Purpose |
|----------|------|---------|
| Staging Environment Readiness Report | `docs/staging-environment-readiness-report.md` | **NEW (Prompt 50B)** Comprehensive staging readiness assessment including blockers, seed script status, migration readiness, and go/no-go gate |
| Vercel Preview Env Checklist | `docs/vercel-preview-env-checklist.md` | **NEW (Prompt 50B)** Owner checklist for confirming Preview DB is non-production and approving seed |
| Staging Database Setup Guide | `docs/staging-database-setup-guide.md` | **NEW (Prompt 50B)** Step-by-step guide for creating a staging Supabase project or local staging DB |
| Staging Role Account Readiness | `docs/staging-role-account-readiness.md` | **NEW (Prompt 50B)** Role account plan including Azure AD auth constraint documentation |
| Prompt 50C Safety Audit | `docs/prompt-50c-safety-audit.md` | **NEW (Prompt 50D)** Documentation of execution safety boundary, proving no unauthorized db mutations occurred. |

### Scripts Modified

| Script | Path | Change |
|--------|------|--------|
| Pilot Seed Script | `scripts/seed-pilot-data.ts` | **FIXED (Prompt 50B)** Production detection changed from URL-based to `NODE_ENV=production`; added `ALLOW_STAGING_PILOT_SEED=YES` flag for staging Supabase pooler connections |

### DB Mutation Command Policy (Prompt 50D)

| Command | Allowed Environment | Danger Level | Policy |
|---------|---------------------|--------------|--------|
| `npx prisma db push --accept-data-loss` | Local (Disposable) | 🔴 CRITICAL | **NEVER** use on staging or production. Overwrites schema destructively. |
| `npx prisma migrate deploy` | Staging / Production | 🟢 SAFE | Standard mechanism for schema changes in persistent environments. |
| `npx tsx scripts/seed-pilot-data.ts` | Staging (Pilot test) | 🟡 HIGH | Requires strict DB separation confirmation and explicit owner approval flags. |

### Pilot Seed Execution Flow

```
Owner completes docs/vercel-preview-env-checklist.md
    │
    ▼
Owner confirms Preview DATABASE_URL ≠ Production DATABASE_URL
    │
    ▼
Agent applies Prisma migrations to staging DB
    │  DIRECT_URL=<staging> npm run db:migrate:deploy
    │
    ▼
Agent runs real pilot seed against staging
    │  DATABASE_URL=<staging>
    │  PILOT_SEED_CONFIRM=YES
    │  ALLOW_STAGING_PILOT_SEED=YES
    │  npx tsx scripts/seed-pilot-data.ts
    │
    ▼
Agent verifies pilot records in staging DB
    │  Confirms PILOT-CASE-* records exist
    │  Confirms PILOT-MTG-* records exist
    │  Confirms AuditLog action=PILOT_SEED_EXECUTED
    │
    ▼
Owner assigns pilot roles to real Microsoft accounts
    │  Via /admin/users on staging deployment
    │
    ▼
Live authenticated pilot workflow tests
    │  (Prompt 50C)
```

### Route Smoke Check Scope (Prompt 50B — Not Yet Executed)

Not executed — staging DB not confirmed. When confirmed, verify:

| Route | Auth Requirement | Expected Result |
|-------|-----------------|----------------|
| `/login` | None | 200 OK |
| `/api/auth/session` | None | JSON `{}` |
| `/api/health/db` | Auth (admin session) | `{status: ok, canConnect: true}` |
| `/dashboard` | Auth | 200 or redirect to login |
| `/cases` | Auth | 200 or redirect |
| `/library` | Auth + permission | 200 or redirect |
| `/admin/system` | Auth + admin | 200 or redirect |

---

*Last updated: Prompt 50B (2026-06-17)*
*Update this file whenever routes, components, or API handlers are added, removed, or significantly modified.*

  
## Prompt 65 Updates  
* Metadata persistence service and endpoints (Blocked/Planned for next prompt).  
* Staging metadata run endpoint and Read-only sync run listing endpoint (Blocked/Planned).  
* Scripts/runbooks/docs added for staging metadata persistence. 
* syncRunReports service.
* report API: /api/document-sync/microsoft/report
* report page/dashboard: /document-sync/report
* UAT report docs: docs/microsoft-graph-metadata-persistence-uat-report.md

## Prompt 68 Updates
* contentIngestionGate (Planned / Blocked)
* contentExtractor (Planned / Blocked)
* contentIngestionPrototype service (Planned / Blocked)
* preview endpoint (Planned / Blocked)
* prototype endpoint (Planned / Blocked)
* runs endpoint (Planned / Blocked)
* UI panel/page (Planned / Blocked)
* smoke script (Planned / Blocked)
* runbook/UAT docs: docs/microsoft-graph-content-ingestion-prototype-readiness-report.md

## Prompt 71 Updates
* evidence pack docs: docs/evidence/graph-content-operator-trial/
* defect log: docs/evidence/graph-content-operator-trial/defect-log.md

## Prompt 72 Updates
* DOCX/PDF design docs: `docs/microsoft-graph-file-type-expansion-design-gate.md`, `docs/microsoft-graph-docx-pdf-expansion-policy.md`, etc.
* optional UI placeholder if added: skipped.
* no parser implementation: yes, skipped.

## Prompt 73 Updates
* docxPdfParserSpikeGate (Blocked)
* docxPdfExtractor (Blocked)
* docxPdfParserSpikePrototype service (Blocked)
* DOCX/PDF preview endpoint (Blocked)
* DOCX/PDF prototype endpoint (Blocked)
* DOCX/PDF runs endpoint (Blocked)
* UI panel/page (Blocked)
* smoke script (Blocked)
* runbook/UAT docs (Created as Blocked)

## Prompt 74 Updates
* DOCX/PDF evidence pack docs: `docs/evidence/graph-docx-pdf-parser-spike/`
* smoke script if added: `scripts/run-docx-pdf-parser-spike-smoke.ps1`
* parser spike UAT docs: `docs/microsoft-graph-docx-pdf-parser-spike-uat-report.md`
* defect log: `docs/evidence/graph-docx-pdf-parser-spike/defect-log.md`


## Prompt 75 Updates
- official integration design docs: docs/microsoft-graph-official-document-integration-design-gate.md, docs/microsoft-graph-official-document-candidate-policy.md, etc.
- optional UI placeholder added to src/app/document-sync/page.tsx
- no implementation routes added.

## Prompt 76 Updates
* officialDocumentCandidateGate (Blocked)
* officialDocumentCandidates service (Blocked)
* candidate preview endpoint (Blocked)
* candidate create/list endpoint (Blocked)
* candidate detail/review endpoint (Blocked)
* candidate audit endpoint (Blocked)
* candidate UI page/panel (Blocked)
* smoke script (Blocked)
* runbook/UAT docs (Created as Blocked)

## Full System Completion Audit (Prompt 77)
- verified that all routes in this map exist and compile successfully.
- no missing or broken page/API routes detected during the build phase.

## Pilot Feedback and Issue Tracking (Prompt 82)
- Added markdown documentation for Issue Tracking, Triage, and Feedback collection.
- Templates added: `docs/PILOT_FEEDBACK_FORM.md`, `docs/PILOT_TRIAGE_BOARD_TEMPLATE.md`, `docs/PROMPT_83_INPUT_TEMPLATE.md`.
- No new UI components or routes were created for issue tracking to adhere to Feature Freeze.

## MVP Auth Override
- **src/lib/auth/mvp-auth.ts**: Provides simple access mode functionality.
- **src/app/api/auth/mode/route.ts**: Fetches current AUTH_MODE.
- **src/app/api/auth/logout/route.ts**: Clears simple mode session.

- **AUTH_MODE=none**: Completely bypasses all authentication, generating a mock 'MVP User' on the fly in src/lib/auth/currentUser.ts and permitting all protected API routes in proxy.ts.
