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
| Records Retention (DB schema) | ✅ Schema only | ❌ UI not built |
| Microsoft Graph (fields) | ⚠️ Partial schema | ❌ Live sync not implemented |

---

## 5. Known Open Gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| COMMISSIONER role — live UAT blocked | Medium | No live account available during Prompts 47–50B |
| VIEWER role — live UAT blocked | Low | No live account available during Prompts 47–50B |
| Records Retention UI | Medium | DB models complete; pages/API not built |
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

## 10. Environment Readiness

| Environment | Status |
|-------------|--------|
| Vercel Production | ✅ Deployed |
| Supabase Production DB | ✅ Connected |
| `.env.production.local` | ✅ Git-ignored |
| `DATABASE_URL` | Set in Vercel (do not document value) |
| `DIRECT_URL` | Set in Vercel (do not document value) |
| `NEXTAUTH_SECRET` | Set in Vercel (do not document value) |
| `MICROSOFT_ENTRA_ID_*` | Set in Vercel (do not document values) |
| `OPENAI_API_KEY` | Set in Vercel (do not document value) |

---

## 11. Required Before Next Major Step

Before proceeding to Prompt 50C (Live Pilot Seed + Workflow Tests):

- [x] Pilot seed data prepared (anonymized real cases or realistic synthetic cases)
- [x] Pilot seed dry-run executed successfully (prior prompts)
- [x] `curl_all.ps1` git-ignored (Prompt 50 cleanup)
- [x] Seed script hardened: uses `NODE_ENV=production` for production detection; `ALLOW_STAGING_PILOT_SEED=YES` for staging (Prompt 50B)
- [x] Staging readiness docs created (`staging-environment-readiness-report.md`, `vercel-preview-env-checklist.md`, `staging-database-setup-guide.md`, `staging-role-account-readiness.md`)
- [ ] **CRITICAL**: Owner completes `docs/vercel-preview-env-checklist.md` and confirms Preview DB is non-production
- [ ] Owner provides explicit seed approval sign-off
- [ ] Staging DB schema ready (migrations applied to staging)
- [ ] Real Microsoft accounts available for authenticated pilot role testing
- [ ] Management approval to execute actual production pilot seeding (separate, later)

---

## 12. Current Recommended Next Action

**Prompt 50C: Execute Live Pilot Seed + Workflow Tests (once staging DB confirmed)**

Objectives:
1. Owner completes `docs/vercel-preview-env-checklist.md` and provides sign-off.
2. Apply Prisma migrations to staging DB.
3. Run real pilot seed against confirmed non-production staging DB.
4. Execute live authenticated workflow tests for all pilot phases.
5. Record pass/fail in `docs/preview-staging-pilot-execution-report.md`.
6. Update GO/NO-GO decision.

**Prerequisites met?**
- Intelligence baseline: ✅
- Pilot data readiness: ✅ (Prompt 48 complete, dry-run passed)
- Seed script hardened: ✅ (Prompt 50B fix applied)
- Staging readiness docs: ✅ (Prompt 50B created)
- Environment classification: ❌ REQUIRED — owner must complete Vercel checklist

---

## 13. Future Prompt Sequencing (Recommended)

| Prompt | Task |
|--------|------|
| 48 | Pilot Data Seeding + Controlled Real-Case Trial |
| 49 | Execute Pilot Data Dry-Run + Seed Preview/Staging Only |
| 50 | Preview/Staging Pilot Workflow Execution (CONDITIONAL GO, BLOCKED on env) |
| 50B | Establish Non-Production Staging DB + Pilot Seed Readiness (this prompt — BLOCKED on owner verification) |
| 50C | Execute Live Pilot Seed + Workflow Tests (pending owner staging DB confirmation) |
| 51 | Records Retention UI build (or Microsoft Graph sync if prioritized) |
| 52+ | Production pilot handoff / staff training |

---

*Last updated: Prompt 50B (2026-06-17)*
*All future prompts must update this file to reflect new completed prompts, changed module statuses, and updated smoke test results.*
