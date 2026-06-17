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
| Records Retention | ✅ Schema ready | Archive records and retention policy models; UI not yet built |
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
- All mutations must happen in API route handlers (POST/PATCH/DELETE) or Server Actions.

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
   a. getCurrentUser() reads session
   b. hasPermission(user.role, permission) checks ROLE_PERMISSIONS map
   c. Throws "UNAUTHORIZED" if no session; "FORBIDDEN" if insufficient role
   d. Route handler must catch and return 401/403 NextResponse
```

### Roles and Capabilities
| Role | Capability Summary |
|------|--------------------|
| ADMIN | All permissions |
| COMMISSIONER | Read access + executive + approve knowledge reuse |
| LEGAL_OFFICER | Full drafting + finalization + dispatch + archive prep |
| REGISTRY_OFFICER | Case registration + import + meetings + dispatch + archive |
| VIEWER | Read-only: dashboard, cases, documents, drafts, meetings |

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

---

## 9. Future Architecture Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Live Microsoft Graph sync not implemented | Medium | Schema ready; implement when priority arises |
| Records Retention UI missing | Medium | DB models exist; UI build deferred |
| Bulk embedding timeout on Vercel | High | Consider background job queue or Supabase pg_cron |
| JWT token staleness after role change | Medium | Force re-login after admin role updates |
| pgvector index performance at scale | Medium | Monitor query times; add HNSW index when needed |
| Unauthenticated test accounts unavailable | Low | UAT partially blocked; documented as known gap |

---

*Last updated: Prompt 50 (2026-06-17)*
*Next expected update: After Prompt 50B (Live Pilot Seed + Workflow Tests)*
