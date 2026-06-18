# PROJECT_STATE.md — GPC Legal Decision Drafting & Case Management System

> **Mandatory Read-First Rule**: All future prompts must begin by reading
> `SKILL.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, `DATABASE_SCHEMA.md`, and `COMPONENT_MAP.md`
> when they exist. At the end of each successful prompt, update the relevant intelligence files.

---

## 1. Current Project Status

**Status: Production-Deployed, UAT Regression Completed (Partial Sign-off)**

The application is deployed to Vercel and connected to Supabase/PostgreSQL in production.
All core modules are implemented. Role-by-role permission regression UAT has been executed
(static code audit + build validation path); live role accounts for COMMISSIONER and VIEWER
were unavailable during Prompt 47.

---

## 2. Latest Stable Deployment State

| Item | Value |
|------|-------|
| Branch | `main` |
| Latest commit | `56713e7` — docs: record preview staging pilot workflow execution — Prompt 50 CONDITIONAL GO |
| Stable tag | `stable-post-prompt-42c` |
| Vercel status | Deployed (assumed Ready — verify after each push) |
| Database connectivity | ✅ `/api/health/db` returns `status: ok`, `canConnect: true` |
| Login page | ✅ Renders successfully |
| Session endpoint | ✅ `/api/auth/session` responds |

---

## 3. Latest Completed Prompts

| Prompt | Description | Status |
|--------|-------------|--------|
| 42C | System Administration + Maintenance Actions console | ✅ Committed, tagged `stable-post-prompt-42c` |
| 43 | Production acceptance + operations runbook documents | ✅ Committed |
| 44 | Authenticated UAT planning + role-permission matrix | ✅ Committed |
| 45 | Authenticated UAT execution + documentation | ✅ Committed |
| 46 | Targeted permission gap hardening (RAG API, library page) | ✅ Committed |
| 47 | Full authenticated role-by-role regression UAT + sign-off pack | ✅ Committed (partial — 2 roles code-audited only) |
| 47.5 | Project intelligence files audit + creation | ✅ Committed |
| 48 | Pilot Data Seeding + Controlled Real-Case Trial | ✅ Committed (Dry-run executed, docs ready) |
| 49 | Execute Pilot Data Dry-Run + Seed Preview/Staging Only | ✅ Committed (Dry-run passed, Preview/Staging seed pending approval) |
| 50 | Preview/Staging Pilot Workflow Execution | ⚠️ CONDITIONAL GO — BLOCKED at environment confirmation. Build ✅. Static audit ✅. Live workflow tests ❌ (environment + accounts blocked). |
| 50B | Establish Non-Production Staging DB + Pilot Seed Readiness | ⚠️ BLOCKED — staging DB not confirmed non-production. Seed script hardened (✅ fix applied). Docs created. Build ✅. |
| 51 | Build Records Retention UI | ✅ Committed (Read-only UI and query layer built. Destructive actions deferred.) |
| 52 | Records Retention UAT + Archive Action Design | ✅ Committed |
| 53 | Archive Dry-Run Preview Endpoint + Permission-Safe UI Panel | ✅ Committed (Endpoint and UI panel built, dry-run guaranteed) |
| 54 | Archive Execution Design Review + Schema Gap Decision | ✅ Committed |
| 55 | Archive/Retention Schema Migration Plan and Prisma Model Updates | ✅ Committed |
| 56 | Dedicated Records Retention Permissions and Role Mapping | ✅ Committed |
| 57 | Archive Execution Endpoint (Staging-only) | ✅ Committed |
| 58 | Archive Execution UI (Preview-first, Staging-only) | ✅ Committed (UI state machine, safety gates built) |
| 59 | Archive Execution UAT and Rollback/Reversal Verification | ✅ Committed (UAT documented/partial; audit/reversal verified) |
| 62 | Microsoft Graph Document Sync Foundation | ✅ Committed (Mock UI/API built, live sync disabled) |
| 63 | Microsoft Graph Live Auth Configuration Checklist + Staging-Only Connectivity Test | ✅ Committed (Blocked on owner confirmation) |
| 64 | Microsoft Graph Metadata-Only Staging Sync Dry Run | ✅ Committed (Blocked on owner confirmation) |

---

## 4. Completed Modules

| Module | Implementation Status | UAT Status |
|--------|----------------------|------------|
| Auth (NextAuth + Azure AD) | ✅ Complete | ✅ Verified (ADMIN path; other roles code-audited) |
| User Admin | ✅ Complete | ✅ Code-audited |
| Case Registry | ✅ Complete | ✅ Code-audited |
| Case Registry Import (Excel) | ✅ Complete | ✅ Code-audited |
| Case Detail | ✅ Complete | ✅ Code-audited |
| Case Drafting | ✅ Complete | ✅ Code-audited |
| AI Draft Section Assistant | ✅ Complete | ✅ Code-audited |
| AI Legal Q&A (RAG) | ✅ Complete | ✅ Code-audited |
| Legal Knowledge Library | ✅ Complete | ✅ Code-audited |
| Document Ingestion/Embedding | ✅ Complete | ✅ Code-audited |
| Finalization Workflow | ✅ Complete | ✅ Code-audited |
| Dispatch Workflow | ✅ Complete | ✅ Code-audited |
| Assignments | ✅ Complete | ✅ Code-audited |
| Meetings | ✅ Complete | ✅ Code-audited |
| Executive Reports | ✅ Complete | ✅ Code-audited |
| Data Quality | ✅ Complete | ✅ Code-audited |
| Search / Case Intelligence | ✅ Complete | ✅ Code-audited |
| System Administration Console | ✅ Complete | ✅ Code-audited |
| Maintenance Actions Console | ✅ Complete | ✅ Code-audited |
| Records Retention UI | ✅ Read-only UI | ⚠️ Pending live UAT |
| Microsoft Graph (fields) | ⚠️ Partial schema | ❌ Live sync not implemented |

---

## 5. Known Open Gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| COMMISSIONER role — live UAT blocked | Medium | No live account available during Prompts 47–50B |
| VIEWER role — live UAT blocked | Low | No live account available during Prompts 47–50B |
| Records Retention Actions | Medium | UI built as read-only; destructive archive/purge actions intentionally deferred |
| Microsoft Graph live document sync | Medium | Fields in schema; actual sync not implemented |
| Background job queue for bulk embedding | Medium | Risk of Vercel timeout on large ingestion |
| pgvector HNSW index | Low | Standard index present; HNSW for scale not added |
| Preview/staging pilot seed | High | Blocked — Vercel preview DB not confirmed non-production; owner must check Vercel dashboard |
| GAP-003: upload-placeholder permission | Medium | `UPLOAD_DOCUMENTS` check missing; deferred |
| GAP-002: `/rag/retrieval-test`, `/legal-qa` | Medium | Partially hardened; full hardening deferred |
| Azure AD auth constraint for pilot accounts | Medium | Seed creates `@example.test` DB records but Azure AD OAuth requires real Microsoft accounts for login |

---

## 6. Known Deferred Risks

| Risk | Notes |
|------|-------|
| JWT staleness after role change | Re-login required after admin changes user role |
| Vercel build ≠ runtime parity | Always verify `/api/health/db` and key routes post-deploy |
| Linux path casing | Windows build may pass but Vercel (Linux) can fail on wrong casing |
| Bulk embedding timeout | Long jobs may hit Vercel serverless timeout |

---

## 7. Last Verified Smoke Test Summary

**Date**: Prompt 50 (2026-06-17)
**Method**: Static code audit + build validation + remote environment probe

| Check | Result |
|-------|--------|
| Build | ✅ Passed (all 67 routes, TypeScript clean) |
| `/api/health/db` (production) | ✅ ok, canConnect: true (prior baseline) |
| `/api/health/db` (preview) | ⚠️ 401 — authenticated route; DB classification unknown |
| Login page renders | ✅ Confirmed |
| `/api/auth/session` | ✅ Responds |
| Unauthenticated access → redirect | ✅ Middleware enforces |
| ADMIN permission checks | ✅ Code-verified |
| LEGAL_OFFICER permission checks | ✅ Code-verified |
| REGISTRY_OFFICER permission checks | ✅ Code-verified |
| COMMISSIONER (live) | ⚠️ Code-audited only |
| VIEWER (live) | ⚠️ Code-audited only |
| Secret scan | ✅ No actual values in tracked files |
| All 67 routes compiled | ✅ Passed |
| Pilot workflow live tests | ❌ Blocked — environment + accounts not confirmed |

---

## 8. Last Permission Hardening Summary

**Prompt 46**: Targeted permission gaps fixed:
- RAG API routes (`/api/rag/qa`, `/api/rag/retrieval`) now protected with `requireApiPermission`
- Library page (`/library`) now checks `hasPermission` server-side before rendering
- All maintenance action API routes verified POST-only + permission-guarded

---

## 9. Production Readiness Status

| Gate | Status |
|------|--------|
| DB health OK | ✅ |
| Migrations applied | ✅ (6 migrations deployed) |
| Build passes | ✅ |
| Login functional | ✅ |
| Core module pages load | ✅ (verified by code audit) |
| No secrets in tracked files | ✅ |
| ADMIN role fully verified | ✅ |
| All roles live-verified | ⚠️ Partial — 2 roles blocked |

**Overall**: **Conditionally Production Ready** — suitable for pilot with ADMIN/LEGAL_OFFICER/REGISTRY_OFFICER accounts. Preview/staging seed blocked until Vercel preview DB is confirmed non-production (owner action required). Prompt 50B hardened seed script and created staging readiness docs. Expand to COMMISSIONER/VIEWER when accounts available.

---

## 9. Next Recommended Action

**Prompt 52: Production Pilot Handoff / Staff Training**

Execution of Prompt 52 is **BLOCKED** until the owner completes the live workflow tests against the verified staging DB, or explicitly approves proceeding with handoff planning while tests are ongoing.

---

## 10. Smoke Test Status

| Route / Module | Status |
|----------------|--------|
| `/admin/system` (RBAC) | ✅ Fully enforced |
| `/api/cases` (Creation) | ✅ Safe (`requireApiPermission` guarded) |
| `/api/cases/[id]/documents` | ⚠️ Missing upload permission check |
| `/api/draft/section-ai` | ✅ Token bound |
| `/library` (RAG ingestion) | ✅ Build verified; performance risks open |
| Admin Role fully verified | ✅ |
| All roles live-verified | ⚠️ Partial — 2 roles blocked (Handoff to owner for full test) |

**Overall**: **Conditionally Production Ready** — suitable for pilot with ADMIN/LEGAL_OFFICER/REGISTRY_OFFICER accounts. Owner has confirmed staging DB is non-production. Prompt 50C execution officially handed off to owner due to security boundaries.

---

## 8. Required Before Next Major Step

Before proceeding to Prompt 51:

- [x] Pilot seed data prepared (anonymized real cases or realistic synthetic cases)
- [x] Pilot seed dry-run executed successfully (prior prompts)
- [x] `curl_all.ps1` git-ignored (Prompt 50 cleanup)
- [x] Seed script hardened: uses `NODE_ENV=production` for production detection; `ALLOW_STAGING_PILOT_SEED=YES` for staging (Prompt 50B)
- [x] Staging readiness docs created (`staging-environment-readiness-report.md`, `vercel-preview-env-checklist.md`, `staging-database-setup-guide.md`, `staging-role-account-readiness.md`)
- [x] **CRITICAL**: Owner completed `docs/vercel-preview-env-checklist.md` and confirmed Preview DB is non-production
- [x] Owner provided explicit seed approval sign-off
- [ ] Owner applies Prisma migrations to staging
- [ ] Owner runs real pilot seed against staging
- [ ] Real Microsoft accounts available for authenticated pilot role testing
- [ ] Management approval to execute actual production pilot seeding (separate, later)

---

## 9. Active Prompt Context

**Prompt 51: Build Records Retention UI (or similar next feature)**

Objectives:
1. Ensure the owner is executing Prompt 50C steps locally.
2. Build remaining feature gaps.

---

## 10. Progress Tracker

| Prompt | Task |
|--------|------|
| 48 | Pilot Data Seeding + Controlled Real-Case Trial |
| 49 | Execute Pilot Data Dry-Run + Seed Preview/Staging Only |
| 50 | Preview/Staging Pilot Workflow Execution (CONDITIONAL GO, BLOCKED on env) |
| 50B | Establish Non-Production Staging DB + Pilot Seed Readiness (Completed) |
| 50C | Execute Live Pilot Seed + Workflow Tests (Handed off to owner, not independently verified) |
| 50D | Staging Safety Audit + Confirm No Production Mutation (Completed) |
| 51 | Records Retention UI build (Completed) |
| 52 | Records Retention UAT + Archive Action Design (Completed) |
| 53 | Archive Dry-Run Preview Endpoint + Permission-Safe UI Panel (Completed) |
| 54 | Archive Execution Design Review + Schema Gap Decision (Completed) |
| 55 | Add Archive/Retention Schema Migration Plan and Prisma Model Updates (Completed) |
| 56 | Add Dedicated Records Retention Permissions and Role Mapping (Completed) |
| 58 | Archive Execution UI — Confirmation, Impact Preview, and Audit Result (Completed) |
| 59 | Archive Execution UAT and Rollback/Reversal Verification (Completed - UAT blocked) |
| 60 | Production Archive Release Gate — NO-GO Pack and Operator SOP (Completed) |
| 61A | Establish Verified Staging DB + Archive Pilot Records (Prepared/Blocked on environment) |
| 61B | Execute Staging DB Migration and Pilot Seed (Blocked on owner confirmation) |
| 62 | Microsoft Graph Document Sync Foundation (Completed) |
| 63 | Microsoft Graph Live Auth Configuration Checklist + Staging-Only Connectivity Test (Blocked on owner confirmation) |
| 64 | Microsoft Graph Metadata-Only Staging Sync Dry Run (Blocked on owner confirmation) |

* **Latest Execution Phase**: Phase 19 (Final report)
* **Primary Objective**: Safely apply staging migration and seed archive pilot records pending owner confirmation.
* **Archive Execution Readiness**: STAGING-ONLY READY (Production disabled).
* **Archive UAT Status**: PARTIAL / BLOCKED — Staging DB blocked, pilot records not executed.
* **Archive Audit Verification Status**: VERIFIED via code audit.
* **Archive Reversal Readiness Status**: Conceptually ready, implementation deferred.
* **Production Release Readiness**: NO-GO. Pending staging execution tests.
* **Microsoft Graph Sync Readiness**: STAGING-ONLY BLOCKED (Production disabled). Live connectivity test remains blocked pending owner confirmation.
* **Microsoft Graph Metadata Dry Run Readiness**: STAGING-ONLY BLOCKED. Implementation blocked pending owner confirmation.
## Progress Checklist
- [x] Records Retention UAT verified.
- [x] Archive action eligibility rules documented.
- [x] Archive API contract documented.
- [x] Archive dry-run preview endpoint built.
- [x] Prompt 54: Schema, permission, audit, and reversibility gates reviewed.
- [x] Prompt 55: Prisma schema updated with `ArchiveBatch`, `ArchiveBatchItem` models and retention fields.
- [x] Prompt 56: Dedicated `PREVIEW_ARCHIVE` and `VIEW_ARCHIVE_AUDIT` permissions added and mapped.
- [x] Prompt 57: Archive execution endpoint implemented with strict staging-only environment gates.
- [x] Prompt 58: Archive execution UI implemented with Preview-first requirement, Reason requirement, Confirmation Phrase requirement, and Environment Status blocks.
- [x] Prompt 59: Archive execution UAT documented, audit verified, and reversal feasibility verified. Staging UAT execution marked as blocked/partial pending live tests.
- [x] **Prompt 60**: Production archive release gate created with NO-GO decision, along with operator SOP, rollback plan, monitoring plan, and approval forms.

## Known Blockers
* **Pilot/Live Blocked**: Full staging database verification and test account assignment must be completed by the project owner.
* **Production Archive Execution Blocked**: Pending owner UAT sign-off on staging and a subsequent production release prompt to remove the environment gate.
* **Production Archive Release Decision**: NO-GO.
* **Microsoft Graph Metadata Dry Run Blocked**: Pending owner confirmation of staging connectivity.

## Next Recommended Prompt
**Prompt 65**: Live Staging Authentication + Microsoft Graph End-to-End Pilot Sync (Pending Owner Confirmation).
  
## Microsoft Graph Sync Readiness (Prompt 65)  
* Schema/Migration: Additive schema generated; migration blocked pending staging DB confirmation.  
* Persistence endpoint: Blocked.  
* Staging persistence test: Blocked.  
* Production sync: Disabled.  
* Next recommended prompt: Prompt 66: Live Staging Authentication + Microsoft Graph End-to-End Pilot Sync (Pending Owner Confirmation). 
