# ARCHITECTURE.md — GPC Legal Decision Drafting & Case Management System

> **Mandatory Read-First Rule**: All future prompts must begin by reading
> `SKILL.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, `DATABASE_SCHEMA.md`, and `COMPONENT_MAP.md`
> when they exist. At the end of each successful prompt, update the relevant intelligence files.

---

## 1. System Overview

A production-grade Thai legal case management and decision-drafting system for
**ก.พ.ค.ตร.** (คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ).

The system manages the full lifecycle of disciplinary grievance (ร้องทุกข์) and
appeal (อุทธรณ์) cases, from case registration through to final decision dispatch and archiving.
It includes AI-assisted legal drafting (RAG-based), knowledge library management, and executive reporting.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js App Router | TypeScript; pages and API routes in `src/app/` |
| Language | TypeScript | Strict mode; no `any` unless documented |
| Styling | Tailwind CSS | Government/legal UI; desktop-first |
| ORM | Prisma v7 | Generated client under `src/generated/prisma` — **not** `@prisma/client` |
| Database adapter | `@prisma/adapter-pg` | Required for Supabase/pgvector |
| Database | PostgreSQL (Supabase) | Pooler connection for Vercel runtime |
| Vector extension | pgvector | `vector(1536)` column on `DocumentChunk` |
| Hosting | Vercel | Serverless; no long-running processes |
| Auth | NextAuth v4 | Azure AD (Microsoft Entra ID) provider; JWT strategy |
| AI | OpenAI | Embeddings: `text-embedding-3-small`; LLM: GPT-4o class |
| External | Microsoft Graph | Document storage integration (OneDrive/SharePoint) — partially implemented |

---

## 3. High-Level Modules

| Module | Status | Description |
|--------|--------|-------------|
| Auth / User / Admin | ✅ Active | NextAuth + Azure AD; role-based; user CRUD admin |
| Case Registry | ✅ Active | Case registration, import from Excel, status tracking |
| Case Drafting | ✅ Active | Section-by-section drafting workspace; AI draft assistant |
| Finalization | ✅ Active | Red-number assignment, final DOCX export, closure |
| Dispatch | ✅ Active | Official notification, acknowledgement, court filing tracking |
| Assignments | ✅ Active | Legal officer/commissioner assignment, workload view |
| Meetings | ✅ Active | Committee meeting scheduling, agenda, post-meeting follow-up |
| Search / Case Intelligence | ✅ Active | Full-text + metadata case search |
| Executive Reports | ✅ Active | Aggregate statistics, XLSX export |
| Data Quality | ✅ Active | Data issue detection, quick-fix, export |
| Library / RAG | ✅ Active | Legal knowledge library, document ingestion, chunking, embedding |
| Legal Q&A | ✅ Active | Retrieval-augmented grounded Q&A with citations |
| System Administration | ✅ Active | Read-only admin console (health, jobs, users, audit) |
| Maintenance Actions | ✅ Active | POST-only audited maintenance actions (orphan cleanup, etc.) |
| Records Retention | ✅ Read-only UI | Archive records and retention UI built; destructive actions deferred |
| Microsoft Graph | ⚠️ Partial | Document metadata fields present; live sync not fully implemented |

---

## 4. Request / Data Flow

```
Browser Request
    │
    ▼
Next.js Middleware (src/middleware.ts)
    │  withAuth — requires authenticated session
    │  Public: /login, /api/auth/*, /api/health/*
    ▼
Next.js App Router
    ├── Server Components (page.tsx files)
    │       └── Call lib/* service functions directly
    │           └── Prisma Client → Supabase PostgreSQL
    │
    └── API Route Handlers (route.ts files)
            ├── requireApiPermission(permission) — throws UNAUTHORIZED/FORBIDDEN
            │       Must be wrapped in try/catch → return 401/403 NextResponse
            ├── Prisma Client → Supabase PostgreSQL
            └── OpenAI API (for RAG/AI draft routes)
```

### Rule: No database mutations in Server Component render
- Server Components may **read** data from the database.
- Do **not** write audit logs or mutate state during RSC render.
- Built using Tailwind CSS, Radix UI primitives, and custom components.
- Standard Next.js `app` router layouts (`/cases/[id]/layout.tsx`).

### 12. Records Retention & Archiving
**Role**: Manages the lifecycle, safe storage, and formal archiving of finalized cases.

**Key Components**:
- **CaseArchiveRecord**: Tracks the retention status, box numbers, physical locations, and due dates (`retentionDueAt`). It also tracks `previousStatusBeforeArchive` to allow safe un-archiving transitions.
- **ArchiveBatch**: A top-level model representing a bulk archive execution action. Links to `User` for auditing.
- **ArchiveBatchItem**: Links `ArchiveBatch` to `Case`, storing the specific impact and exact blocked reasons (if skipped) or result message (if executed).

**Design Decisions**:
- **Read-Only First**: The UI (`/records-retention`) is designed to be read-only first. Execution API is separated and currently not implemented.
- **Batch Auditing**: All executed archive actions map to an `ArchiveBatch` to ensure auditability of bulk changes, and individual impacts to `ArchiveBatchItem`.
- **No Cascade Deletes for Archive**: Archiving does not delete the `Case` or any sub-models. It merely changes the status to `ARCHIVED` and updates `CaseArchiveRecord`.
- **Archive Action Design Boundary**: Destructive actions are not yet implemented. Future architecture dictates a POST-only `/api/records-retention/archive` endpoint that performs execution.
- **Archive Dry-Run Preview Flow**: Client component submits selected `caseIds` via `POST /api/records-retention/archive/preview` endpoint (protected by `PREVIEW_ARCHIVE`). The endpoint validates batch limits and evaluates conservative eligibility rules (e.g. checking meetings, statuses, legal hold) without modifying database state.
- **Archive Execution Flow (Staging Only)**: Requires explicit `ARCHIVE_CASE` permission. Enforces a strict environment gate (production blocked). Requires dry-run preview first. Requires reason and exact confirmation phrase. Transaction commits the batch, updates statuses, and writes to audit trail.
- **Archive Execution UI Flow**: `ArchivePreviewPanel` acts as a state machine: Preview -> Eligibility Check -> Reason/Confirmation -> Execute -> Audit Result.
- **Archive Execution Readiness**: STAGING-ONLY. Blocked from production execution by an environment gate.
- **Archive UAT Verification Flow**: Must verify unauthenticated, unauthorized, preview-only, execute-authorized, blocked-case, eligible-case, audit verification, reversal feasibility, and production-block paths.
- **Archive Audit Verification Flow**: Ensure `actor.id`, action, case ID, batch ID, timestamp, reason, before/after states (`previousStatusBeforeArchive`) are recorded, and no raw confirmation phrases or secrets are stored.
- **Archive Reversal Feasibility Flow**: Schema preserves `previousStatusBeforeArchive` and `ArchiveBatchItem.previousCaseStatus`. Reversal is conceptually ready (no data loss, documents linked) but implementation is deferred.
- **Archive Production Block Boundary**: Production execution is explicitly disabled by `assertArchiveExecutionEnvironment()`. A dedicated release gate prompt is required to override this block.
- **Archive Production Release Gate**: Currently NO-GO. Required staging execution with pilot records must pass before production release.

---

## 5. Auth and Permission Flow

```
1. User navigates to protected route
2. middleware.ts (withAuth) checks JWT session cookie
3. If no valid session → redirect to /login
4. /login → NextAuth Azure AD OAuth flow
5. On successful OAuth:
   a. authOptions signIn callback: upsert User in DB; check domain allowlist; check DISABLED status
   b. authOptions session callback: attach id, role, status from DB to JWT session
6. Session token carries: user.id, user.role, user.email, user.status
7. API routes call requireApiPermission(permission):
   a. getCurrentUser()
```

### Data Access & Security

-   **Authentication**: Configured for NextAuth with credentials provider (mocking production SSO) and Azure AD OAuth. NextAuth is active in staging/production, blocking unauthenticated access broadly via `middleware.ts`.
-   **Authorization**: Role-based access control (RBAC) enforced via server-side permission checks (`requireApiPermission`, `requirePermission`) rather than relying solely on UI hiding.
-   **Permission Matrix**:
    -   `ADMIN`: Full access, configuration, and UAT matrix view.
    -   `COMMISSIONER`: Read-only, review, and approval access.
    -   `LEGAL_OFFICER`: Draft creation, case editing, and document processing.
    -   `REGISTRY_OFFICER`: Intake, dispatch, registry sync, and case assignment.
    -   `VIEWER`: Read-only reporting access.
-   **Records Retention Security Boundary**:
    -   `PREVIEW_ARCHIVE` permission is required to run non-mutating dry-runs of archive impact.
    -   `EXECUTE_ARCHIVE` (via `ARCHIVE_CASE`) permission is strictly reserved for the actual destruction/state-mutation endpoint (which remains intentionally unimplemented pending further UAT).
    -   UI visibility of preview controls does NOT substitute for backend execution protection. The execution API must remain separate from the preview API.
-   **Row Level Security (RLS)**: Expected to be handled primarily via Prisma queries mapped to user context in the application layer, given Supabase pooler usage.

---

## 6. Deployment Flow

```
Developer commits → pushes to main branch
    │
    ▼
Vercel detects push → triggers build
    │  Build command: `npm run build`
    │  Note: Do NOT run `prisma migrate deploy` inside Vercel build
    │  Prisma generate runs as part of build
    ▼
Vercel deploys serverless functions
    │
    ▼
Runtime: Vercel functions connect to Supabase via DATABASE_URL (transaction-mode pooler)
```

### Critical Deployment Rules
- **Build success ≠ runtime success.** Always verify `/api/health/db` post-deploy.
- Environment variables set in Vercel dashboard; old deployments use old env snapshot.
- Redeploy is required after any env variable change.
- `prisma migrate deploy` must be run **manually** (not in Vercel build command).
- Linux/Vercel path casing is strict; Windows local build may pass even with wrong casing.
- Always check untracked files before claiming Vercel parity.

---

## 7. Runtime Health Flow

```
GET /api/health/db
    ├── Reads DATABASE_URL from env
    ├── Attempts Prisma $queryRaw SELECT 1
    └── Returns: { status, databaseConfigured, canConnect, host (masked) }

GET /api/integrations/microsoft/status
    └── Returns Microsoft Graph connectivity status
```

**Known `/api/health/db` host signals:**
- `pooler.supabase.com:6543` + `status: ok` → correctly configured
- `base` → env variable misconfigured or old deploy in use
- `db.<project>.supabase.co:5432` → direct connection (switch to pooler for Vercel)

---

## 8. Known Architectural Constraints

1. **Vercel serverless timeout** — Long AI operations (embedding generation, bulk ingestion) may time out. These should be background jobs or chunked.
2. **pgvector** — Requires Supabase with pgvector extension enabled. Extension must be enabled manually in Supabase.
3. **Microsoft Graph integration** — Document sync fields exist in schema but live sync is not fully implemented. Fields `driveId`, `driveItemId`, `webUrl` are placeholders for future integration.
4. **No server-side session storage** — JWT strategy; session data is in the token. Role changes require re-login or token refresh.
5. **Prisma client path** — Always import from `src/generated/prisma`, never from `@prisma/client`.
6. **Maintenance actions** — Must be POST-only, permission-guarded, confirmation-protected, and audit-logged. Never executed during render/import phase.
7. **No seed on production** — `prisma/seed.ts` is development only; never run on production unless explicitly confirmed.
8. **Pilot Seeding Mechanism** — Pilot data seed is managed via `scripts/seed-pilot-data.ts`. It uses upsert, is dry-run by default, and demands explicit flags to touch production data (`ALLOW_PRODUCTION_PILOT_SEED=YES`).
   - *Pilot Seed Dry-Run Flow*: Seed script defaults to non-mutating logging mode. It validates target counts safely.
   - *Preview/Staging Seed Flow*: Runs only when DB is non-production and explicit flags are passed.
   - *Seed Validation Flow*: Manual inspection using Prisma Studio or UI to verify data prefixed with `PILOT_` exists.
   - *Cleanup Readiness Flow*: Safe manual query strategy targeting `PILOT_` prefix; destructive auto-cleanup scripts are prohibited.
9. **Controlled Trial Process** — Trials use anonymized or sanitized cases first, monitored carefully before moving to full production usage. Cleanups rely on manual identifier tags (`PILOT_`) instead of destructive scripts.
10. **Preview/Staging Pilot Validation Gate (Prompt 50)**:
    - Vercel preview deployments likely share the production Supabase database unless a separate `DATABASE_URL` is set under "Preview" in Vercel dashboard.
    - Before executing any real seed against a Vercel-deployed environment, the owner MUST verify the database classification via the Vercel dashboard (Project → Settings → Environment Variables → Preview tab).
    - If the preview DB is not confirmed non-production, the pilot is BLOCKED at environment confirmation phase.
    - Pilot workflow execution must not proceed past static code audit until environment + role accounts are confirmed.
    - **Defect classification must precede code fixes** for any workflow failure found during pilot tests.
    - *Staging-only validation flow*: Build pass → Secret scan → Remote environment probe → DB classification → Role account confirmation → Pilot seed → Live workflow tests → Pass/fail record → GO/NO-GO decision.
11. **Environment Variable Scope Strategy (Prompt 50B)**:
    - Vercel supports per-scope env vars: Production, Preview, Development.
    - A truly separate staging database must be configured as a **Preview-scope** `DATABASE_URL` pointing to a different Supabase project.
    - HTTP 401 from `/api/health/db` proves auth middleware is working; it does NOT prove DB separation.
    - DB classification can only be confirmed by inspecting the Vercel dashboard env variable values.
12. **Pilot Seed Gate (Prompt 50B)**:
    - Real seed execution requires ALL of: confirmed non-production DB, owner sign-off, migrations applied to staging, dry-run pass, cleanup plan ready.
    - Seed flags: `PILOT_SEED_CONFIRM=YES` (enables real mode) + `ALLOW_STAGING_PILOT_SEED=YES` (for Supabase pooler URLs outside production NODE_ENV).
    - NEVER set `ALLOW_PRODUCTION_PILOT_SEED=YES` for a staging environment.
    - Azure AD (Microsoft Entra ID) authentication means `@example.test` seed users cannot log in via OAuth. Live pilot tests require real staff Microsoft accounts assigned to pilot roles in the staging DB.
13. **Staging Environment Boundary (Prompt 50D)**:
    - **Production**: Vercel Production deployment → Production Supabase DB → Real case data.
    - **Preview/Staging**: Vercel Preview deployment or local dev → Staging Supabase DB (separate project) → Pilot data only.
    - **Local**: Local dev server → Ephemeral local database (e.g. `localhost:51213`).
    - Both environments use the same codebase; only the DATABASE_URL differs.
    - Migrations must be applied to staging separately before seeding.
14. **Command Execution Safety Boundary (Prompt 50D)**:
    - Destructive commands like `npx prisma db push --accept-data-loss` are strictly confined to the Local (ephemeral) boundary.
    - They must never be executed against Staging or Production boundaries.
    - Reading `.env*` files in terminal sessions risks leaking environment boundary secrets into logs and is prohibited outside local debug sessions with masked logs.
15. **Staging Archive Pilot Readiness Flow (Prompt 61A/61B)**:
    - Staging execution requires manual migration of `ArchiveBatch` schema to staging. Migration/seed gate requires explicit owner-confirmed DB separation.
    - Pilot seed flow for archive explicitly tests execution boundaries using categorized fake records (`PILOT_ARCHIVE_ELIGIBLE_`, etc.).
    - Pilot record verification flow explicitly requires verifying pilot prefixes in confirmed staging DB.
    - Role-account UAT preparation flow identifies precise Microsoft accounts required for staging UAT.

---

## 9. Future Architecture Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Live Microsoft Graph sync not implemented | Medium | Schema ready; implement when priority arises |
| Destructive Records Retention actions missing | Medium | UI is read-only; destructive archive/purge needs strong auditing boundaries |
| Bulk embedding timeout on Vercel | High | Consider background job queue or Supabase pg_cron |
| JWT token staleness after role change | Medium | Force re-login after admin role updates |
| pgvector index performance at scale | Medium | Monitor query times; add HNSW index when needed |
| Unauthenticated test accounts unavailable | Low | UAT partially blocked; documented as known gap |

---

*Last updated: Prompt 50B (2026-06-17)*
*Next expected update: After Prompt 50C (Live Pilot Seed + Workflow Tests once staging DB confirmed)*
