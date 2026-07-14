## Prompt 86 Lessons Learned

1. **Controlled Pilot Strictness**: Prompt 85 correctly blocked the launch due to a build failure. Prompt 86 focused solely on safe, minimal fixes to unblock the build without feature creep.
2. **Next.js Font Fix**: Replacing 
ext/font/google with a <link> in layout.tsx is a fast, safe way to unblock Turbopack build errors.
3. **Strict Linting vs. Launch**: Downgrading legacy TypeScript ny errors to warnings in ESLint allows the pilot to proceed to real-world testing without rewriting legacy code.

# SKILL.md — GPC Legal Decision Drafting & Case Management System

> **MANDATORY AGENT WORKFLOW RULE**
> Every future prompt MUST:
> 1. **Start** by reading `SKILL.md`, `ARCHITECTURE.md`, `PROJECT_STATE.md`, `DATABASE_SCHEMA.md`, and `COMPONENT_MAP.md` when they exist.
> 2. **End** by updating the relevant intelligence files to reflect new lessons, architecture changes, schema changes, component/API changes, and project state.
> Failure to follow this workflow risks repeating solved problems and introducing regressions.

## 1. Mission

You are assisting development of a production-grade Thai legal decision drafting and case management system for ก.พ.ค.ตร. (คณะกรรมการพิทักษ์ระบบคุณธรรมข้าราชการตำรวจ).

The system must support:
- case registry and case tracking
- legal decision drafting workspace
- document/knowledge library
- Legal RAG retrieval with citations
- grounded legal Q&A
- AI-assisted section-by-section drafting
- audit logging
- Vercel deployment
- Supabase/PostgreSQL production database
- future OneDrive/SharePoint integration
- future Microsoft authentication and role-based permissions

This is a legal/government workflow system. Reliability, traceability, source control, and careful legal wording are more important than speed or flashy UI.

---

## 2. Current Project Status

The project has reached **Prompt 47.5** — see `PROJECT_STATE.md` for the definitive status table.

Summary:
- All core modules are **implemented and deployed** on Vercel.
- Production database connectivity: **confirmed** (`/api/health/db` returns ok).
- Role-by-role UAT regression completed (Prompt 47): ADMIN/LEGAL_OFFICER/REGISTRY_OFFICER code-verified; COMMISSIONER/VIEWER blocked (no live accounts).
- Permission hardening complete as of Prompt 46.
- Stable tag: `stable-post-prompt-42c`.
- Next recommended step: **Prompt 48 — Pilot Data Seeding + Controlled**

### Schema Design and Migrations
1. **Migrations**: `DATABASE_URL` is for the application at runtime (transaction mode pooler, port 6543). `DIRECT_URL` uses session-mode pooler (port 5432) for migrations.
2. **Never** run `prisma migrate deploy` during the Vercel build process.
3. **Additive changes only**: Archive/retention schema changes must be additive and backward-compatible. Use nullable fields or safe defaults.
4. **Migration safety**: Do not run migration deployment (`migrate deploy`) in schema design prompts. Migration SQL must be inspected for `DROP`/`ALTER` destructive operations before commit.
5. **Execution separation**: Schema support (e.g., adding `ArchiveBatch` models) must be kept strictly separate from the implementation of execution logic. Archive execution remains separate from schema support.

- Real-Case Trial.
- `DATABASE_URL` uses Supabase transaction-mode pooler (host `aws-1-ap-northeast-2.pooler.supabase.com:6543`).
- `DIRECT_URL` uses session-mode pooler (port 5432) for migrations.
- 6 migrations applied to production.
- Do NOT run `prisma migrate deploy` inside Vercel build.
- Do NOT run `db:seed` on production without explicit confirmation.

---

## 3. Core Technology Stack

Use and preserve this stack unless explicitly instructed otherwise:

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- ORM: Prisma v7
- Database: PostgreSQL / Supabase
- Hosting: Vercel
- AI provider: OpenAI
- Embeddings model: `text-embedding-3-small`
- Vector strategy: PostgreSQL/pgvector or existing project RAG structure
- File storage future target: OneDrive/SharePoint
- Auth future target: Microsoft Entra ID

Do not replace the stack without explicit approval.

---

## 4. Non-Negotiable Legal Safety Rules

This system is for legal decision drafting. Follow these rules strictly:

1. No source = no answer.
2. No retrieved source = no AI draft.
3. Never invent:
   - facts
   - names
   - ranks
   - positions
   - dates
   - case numbers
   - order numbers
   - legal provisions
   - court judgment numbers
   - final legal conclusions
4. AI must use only approved retrieved context.
5. Do not use general model knowledge for legal answers.
6. Every important legal statement must be traceable to source chunks.
7. Drafting must be section-by-section only.
8. Never draft a full decision in one AI call.
9. Never auto-overwrite human draft text.
10. AI output must always be presented as a draft requiring human legal review.
11. Human legal officer / commissioner review is mandatory.
12. Draft sources and inactive sources must not be treated as official authority.
13. Do not mix mock data with production data.
14. Do not silently fallback to mock data in production.
15. If database or source retrieval fails, show a clear admin-facing error.

---

## 5. Thai Legal Drafting Style

Use formal Thai legal/government language.

Preferred wording patterns:
- “ข้อเท็จจริงรับฟังได้ว่า…”
- “มีประเด็นที่จะต้องวินิจฉัยว่า…”
- “พิเคราะห์แล้วเห็นว่า…”
- “เมื่อพิจารณาประกอบกับ…”
- “จึงเห็นได้ว่า…”
- “กรณีจึงเป็นไปตามหลักเกณฑ์และวิธีการที่กฎหมายกำหนด”
- “คำร้องทุกข์ฟังไม่ขึ้น”
- “อุทธรณ์ฟังขึ้น”
- “จึงวินิจฉัยยกคำร้องทุกข์”
- “จึงวินิจฉัยยกเลิกคำสั่ง…”

Avoid:
- casual wording
- emotional wording
- overclaiming
- unsupported conclusions
- ambiguous legal references
- inconsistent terms such as mixing “ผู้ร้องทุกข์” and “ผู้อุทธรณ์” incorrectly

Terminology:
- ร้องทุกข์: use “ผู้ร้องทุกข์” and “คู่กรณีในการร้องทุกข์”
- อุทธรณ์: use “ผู้อุทธรณ์” and “คู่กรณีในอุทธรณ์”
- Use “ก.พ.ค.ตร.” consistently.
- Use “คำวินิจฉัย” consistently.
- Keep Thai legal structure and order.

---

## 6. Core Decision Document Structure

For grievance decisions:
1. Heading / เรื่องดำ / เรื่องแดง
2. Committee name
3. Date
4. Parties
5. Subject
6. Summary of grievance
7. Request of the petitioner
8. Counterparty statement
9. Additional submissions if any
10. Established facts
11. Jurisdiction/admissibility
12. Issues for determination
13. Applicable laws
14. Legal reasoning
15. Decision result
16. Right to file case with Supreme Administrative Court
17. Committee signatures

For appeal decisions:
1. Heading / เรื่องดำ / เรื่องแดง
2. Committee name
3. Date
4. Parties
5. Subject
6. Summary of challenged order
7. Summary of appeal
8. Request of appellant
9. Counterparty statement
10. Additional submissions if any
11. Established facts
12. Jurisdiction/admissibility
13. Issue: whether appeal is admissible
14. Issue: whether disciplinary procedure was lawful
15. Issue: whether facts support misconduct
16. Applicable laws
17. Legal reasoning
18. Decision result
19. Right to file case with Supreme Administrative Court
20. Committee signatures

---

## 7. Database and Environment Rules

Environment variables:

- `DATABASE_URL`
  - Used for app runtime on Vercel.
  - Should use Supabase transaction-mode pooler.
  - Example pattern only:
    `postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`

- `DIRECT_URL`
  - Used for Prisma migrations.
  - Should use Supabase session-mode pooler.
  - Example pattern only:
    `postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres`

- `OPENAI_API_KEY`
  - Server-side only.
  - Never expose to client.

- `EMBEDDING_MODEL`
  - Default: `text-embedding-3-small`

Rules:
- Never print or expose actual env values.
- Never commit `.env`, `.env.local`, `.env.production.local`, secrets, tokens, passwords, or API keys.
- Never hardcode database URLs.
- In production, reject localhost, 127.0.0.1, `base`, or placeholder database hosts.
- Do not run seed on production unless explicitly instructed.
- Run migrations only when the user confirms.
- Staging must be verified before pilot seed or archive UAT. Staging migration and seed require explicit owner-confirmed DB separation.
- Pilot seed scripts must default to dry-run and fail closed. Pilot seed execute mode requires dry-run pass first. Missing DB URL / refused connection is safe fail-closed, not a reason to bypass.
- Pilot archive records must use clear fake prefixes.
- Code audit does not unblock production release.
- Prompt 61B does not run archive execution.
- Pilot data must be anonymized and clearly prefixed (e.g. PILOT_).
- Seed scripts must be dry-run by default and manual only.
- Pilot seed execution must be separated into dry-run, preview/staging, and production approval phases.
- Never run production seed without explicit owner approval and guard flags.
- Seed validation must confirm prefix/tag, idempotency, and no real data.
- Cleanup must be planned before real seed.
- Cleanup must identify pilot records by prefix/tag and never delete real records.
- Controlled real-case trials must start with 3–5 sanitized cases, not broad rollout.

---

## 8. Prisma Rules

Prisma v7 is used.

Important:
- Do not import `PrismaClient` from `@prisma/client` if this project uses generated output under `src/generated/prisma`.
- Import Prisma client from the generated path already used in the project.
- Keep Prisma adapter configuration consistent with the project.
- `DATABASE_URL` is for runtime.
- `DIRECT_URL` is for migrations if schema/config supports it.
- Do not change Prisma schema casually.
- If schema changes, create a migration and explain why.
- **Vercel preview deployments share the production database by default.** Always verify the "Preview" environment variable tab in the Vercel dashboard before executing any seed or mutation against a preview deployment.
- **HTTP 401 from `/api/health/db` proves auth is working — it does NOT prove the database is separate from production.** Do not infer DB classification from auth responses alone.
- **Real pilot seed requires confirmed non-production DB, owner approval, dry-run pass, and cleanup plan.** All four conditions must be met before executing any real seed.
- **Environment variable values must be verified by name/scope only.** Never document actual secret values, connection strings, or passwords anywhere in tracked files.
- **Staging Supabase projects use pooler URLs** — the same URL pattern as production Supabase. Use `NODE_ENV=production` (not URL content) to detect true production environment in scripts.
- **Use separate flag names for staging vs. production overrides** — `ALLOW_STAGING_PILOT_SEED=YES` for staging, `ALLOW_PRODUCTION_PILOT_SEED=YES` for production. Never use the production flag for staging.
- **Prisma client initializes at import time** — dry-run scripts still require a DATABASE_URL even if they make no DB calls. This is expected behavior, not a bug.
- **Never use `prisma db push --accept-data-loss` on staging or production.** Use migration-based schema changes only (`prisma migrate deploy`).
- **Any command reading `.env*` can expose secrets in terminal logs.** Do not commit terminal or task logs to the repository.
- **Pilot seed execution must not proceed if DB target cannot be proven non-production.**
- **Handed-off execution is not the same as verified execution.** If a step was handed off to the owner (e.g., Prompt 50C), it must remain marked as blocked/pending verification until the owner confirms success.
- Pilot seed execution must be separated into dry-run, preview/staging, and production approval phases.
- Never run production seed without explicit owner approval and guard flags.
- Seed validation must confirm prefix/tag, idempotency, and no real data.
- Cleanup must be planned before real seed.
- Cleanup must identify pilot records by prefix/tag and never delete real records.
- Controlled real-case trials must start with 3–5 sanitized cases, not broad rollout.
- **Preview/staging pilot workflow execution must verify end-to-end workflows with pilot-only data.** Static code audit is insufficient — live authenticated role tests are required for a full pass.
- **Pilot workflow pass requires route, role, API, and data-scope verification** — build-only or static-audit-only must be recorded as partial, not full pass.
- **Core workflow failures must be classified (Severity A–D) before applying code fixes.**
- **Production mutation remains prohibited until explicit real-case trial approval.**
- Untracked scripts (`curl_all.ps1`, `test_routes.ps1`, etc.) that are localhost-only developer tools should be added to `.gitignore`, not committed.
- **Microsoft Entra ID (Azure AD) OAuth authentication means DB-seeded `@example.test` users cannot log in** without real Microsoft accounts. Live pilot UAT requires real staff Microsoft accounts assigned to pilot roles in the staging DB via the admin UI.

Required checks after Prisma-related work:
```bash
npx prisma generate
npx tsc --noEmit
npm run build
```

Production migration command:
```bash
npx prisma migrate deploy
```

Do not run:
```bash
npm run db:seed
```
unless the user explicitly confirms.

---

## 9. RAG and AI Rules

Legal RAG pipeline must follow:

1. Approved sources only
2. Metadata-aware retrieval
3. Citation-preserving chunks
4. No-source-no-answer behavior
5. AI response stored with:
   - query
   - retrieved chunk IDs
   - answer
   - citations
   - model
   - timestamp
   - user ID or mock user ID
6. Retrieval must support:
   - keyword search
   - vector search
   - hybrid search
   - source status filter
   - reliability level filter
   - legal category filter
   - issue tags filter
   - decision result filter

Legal Q&A must:
- retrieve first
- pass only retrieved chunks to the model
- answer only from retrieved context
- cite source chunks
- state insufficiency if sources do not support an answer

AI Draft Section Assistant must:
- draft one section only
- retrieve first
- refuse if source support is insufficient
- display retrieved sources
- display AI draft preview
- require manual insert
- create audit logs
- never overwrite existing draft text automatically

---

## 10. Audit Logging Rules

Audit logs are mandatory for important actions.

Log at minimum:
- case viewed
- case status changed
- draft section edited
- draft section status changed
- document metadata changed
- legal source metadata changed
- ingestion started/completed/failed
- embedding started/completed/failed
- retrieval query
- legal Q&A request
- AI draft section requested/generated/inserted/failed

Audit fields:
- userId or mock user ID
- action
- entityType
- entityId
- beforeValue
- afterValue
- timestamp

Never attribute actions to a random admin fallback user.

---

## 11. UI/UX Rules

Design must be:
- Thai language first
- official
- clean
- legal/government style
- desktop-first
- readable
- not flashy
- not consumer-app style

Use:
- sidebar navigation
- status badges
- cards
- tables
- timeline
- review checklists
- warning boxes for production/data/source issues

For errors:
- show clear admin-facing Thai messages
- do not expose secrets
- do not show raw stack traces to normal users
- show actionable next steps

Production database error example:
“ไม่สามารถเชื่อมต่อฐานข้อมูล Production ได้ กรุณาตรวจสอบ DATABASE_URL ใน Vercel Environment Variables”

AI warning:
“ข้อความนี้เป็นร่างจาก AI ต้องตรวจสอบโดยนิติกร/กรรมการก่อนใช้งานจริง”

---

## 12. Repository Safety Rules

Before editing:
```bash
git status
```

Always identify:
- existing modified files
- untracked files
- unrelated changes

During work:
- Do not delete files/folders without explicit explanation.
- Do not modify unrelated files.
- Do not commit secrets.
- Do not change `.env` values.
- Keep each task focused.
- Do not mix multiple features into one commit.

After implementation:
```bash
npx prisma generate
npx tsc --noEmit
npm run build
```

Before commit:
```bash
git diff --stat
```

Commit rules:
- Stage only files related to the current task.
- Use clear conventional commit messages:
  - `feat: ...`
  - `fix: ...`
  - `chore: ...`
  - `docs: ...`
  - `refactor: ...`
- Push to current branch after successful build.
- Confirm clean working tree:
```bash
git status
```

Final response must include:
- summary of what was implemented
- files changed
- commands run
- typecheck result
- build result
- commit message
- commit hash
- push status
- warnings/follow-up risks

---

## 13. Deployment Rules

Vercel deployment checklist:
1. Check latest commit deployed.
2. Check deployment status is Ready.
3. Check `/api/health/db`.
4. Confirm `DATABASE_URL` and `DIRECT_URL` are set in Production.
5. Confirm `OPENAI_API_KEY` is set in Production if AI features are used.
6. Confirm `EMBEDDING_MODEL` is set.
7. Redeploy after environment variable changes.
8. Do not assume old deployments use new env values.

If `/api/health/db` returns:
- host `base`: env is wrong or old deployment is used.
- host `db.<project>.supabase.co:5432`: direct connection is used; switch to Supabase pooler for Vercel.
- host `pooler.supabase.com:6543` and status ok: runtime DB is connected.

---

## 14. Production Readiness Gate

Do not proceed to new AI features unless all are true:

- `/api/health/db` returns ok.
- Prisma migrations have been applied.
- Supabase tables exist.
- `/dashboard` loads without production DB error.
- `/cases` loads without production DB error.
- `/library` loads without production DB error.
- Existing build passes.
- Git working tree is clean.

---

## 15. Task Execution Template

For every new task, follow this process:

1. Restate the task.
2. Inspect relevant files.
3. Propose a short plan if the task is risky.
4. Run `git status`.
5. Make focused changes.
6. Run required checks.
7. Commit and push if checks pass.
8. Provide final report.

Use this exact final report format:

```text
Summary:
Files changed:
Commands run:
Typecheck:
Build:
Database/migration impact:
Security/secrets impact:
Commit:
Commit hash:
Push:
Warnings / next steps:
```

---

## 16. Current Recommended Next Step

See `PROJECT_STATE.md` §12 for the definitive recommended next step.

Summary: **Prompt 48 — Pilot Data Seeding + Controlled Real-Case Trial**

Prerequisites:
- Intelligence baseline: completed (this prompt, Prompt 47.5)
- COMMISSIONER/VIEWER live UAT: partially blocked (documented gap)

---

## 17. UAT & Authorization Rules

- Authenticated UAT must verify backend API permission enforcement (e.g., `requireApiPermission`, `hasPermission`), not only UI visibility.
- Do not mark UAT passed unless each role was tested with an authenticated account (or the report explicitly states it was a static code audit).
- NextAuth middleware (`withAuth`) prevents unauthenticated access broadly, but granular authorization requires explicit role checks on every mutating API and sensitive page.
- Maintenance actions require POST, explicit permission checks, confirmation phrases for destructive actions, and audit logging.
- After fixing auth/permission issues, rerun production-like smoke tests.
- Permission hardening must start from the UAT gap register and fix only confirmed gaps.
- Backend API enforcement must be verified before UI hiding is considered sufficient.
- Mutation endpoints require explicit permission checks and structured unauthorized responses.
- Admin maintenance routes must remain POST-only for actions and must never execute actions during render/import.
- After permission changes, run build plus unauthenticated route smoke tests.
- Role UAT must test both page access and direct API challenge attempts for each role.
- A permission gap is not verified fixed until unauthenticated, unauthorized, and authorized paths are all tested.
- A route returning build-pass but runtime 500 must be treated as UAT failure.
- Sign-off packs must clearly distinguish tested roles from planned/blocked roles.
- Do not claim full UAT pass when some role accounts are unavailable; record as partial with explicit blocked items.
- `requireApiPermission` throws `"UNAUTHORIZED"` / `"FORBIDDEN"` rather than returning a `NextResponse`; API handlers must call it inside `try/catch` and map to 401/403.
- Static code audit + build validation is a valid but incomplete substitute for live authenticated UAT; always document the distinction.
- Do not run `prisma migrate deploy` inside the Vercel build command.
- Do not use `prisma db push --accept-data-loss` on staging or production.
- Do not write audit logs or database mutations during React Server Component render.
- Maintenance/archive actions must be POST-only, permission-protected, confirmation-protected, and audited.
- Do not expose secrets to the client or logs.
- Never commit `.env*` files or real secret values.
- Prisma Client is generated to the project-specific generated client path (`src/generated/prisma`).
- `requireApiPermission` throws `"UNAUTHORIZED"` / `"FORBIDDEN"` rather than returning `NextResponse`; API handlers must call it inside `try/catch` and map errors to 401/403.
- Pilot/live workflow remains blocked until staging DB and role accounts are manually verified.

### Before starting work:
1. Read `SKILL.md` (this file)
2. Read `ARCHITECTURE.md` (if touching system structure, deployment, or tech stack)
3. Read `PROJECT_STATE.md` (always — to know where we are)
4. Read `DATABASE_SCHEMA.md` (if touching Prisma schema, migrations, or models)
5. Read `COMPONENT_MAP.md` (if adding/modifying routes, components, or API handlers)

### After completing work:
1. Update `PROJECT_STATE.md`: completed prompts table, module status, smoke test summary
2. Update `SKILL.md`: new lessons learned, new rules from solved problems
3. Update `ARCHITECTURE.md`: if system structure, modules, or deployment flow changed
4. Update `DATABASE_SCHEMA.md`: if schema changed, migration added, or model notes changed
5. Update `COMPONENT_MAP.md`: if routes, components, or API handlers added/removed/changed

### Quick validation:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-project-intelligence.ps1
```

---

## 19. Anti-Patterns to Avoid

These patterns have caused real problems in this project. Do not repeat them:

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Import from `@prisma/client` | Always import from `src/generated/prisma` |
| Run `prisma migrate deploy` in Vercel build | Run migrations manually with `DIRECT_URL` |
| Assume build success = runtime success | Always verify `/api/health/db` post-deploy |
| Write audit logs in React Server Component render | Write mutations only in API routes / Server Actions |
| Call `requireApiPermission` without try/catch | Always wrap in try/catch; return 401/403 NextResponse |
| Claim full UAT when accounts unavailable | Document as partial; list blocked items explicitly |
| Commit `.env`, `.env.local`, secrets, tokens, passwords | Never commit — always verify with `git grep` |
| Mix mock data with production data | Always guard with `NODE_ENV` checks |
| Trust Windows build for Linux/Vercel path casing | Use lowercase filenames; verify on Vercel |
| Claim untracked files are deployed | Always run `git status --untracked-files=all` before claiming parity |
| Run broad PowerShell bulk edits across routes | Make targeted, specific changes; one concern per PR |
| Use `prisma migrate dev` on production | Use `prisma migrate deploy` only on production |
| Auto-overwrite human draft text | AI output must be manually inserted; never auto-overwrite |
| Draft full legal decision in one AI call | Draft section-by-section only |
| Skip updating intelligence files after a prompt | Always update relevant docs as the final step |
| Assume Vercel preview = separate staging DB | Verify in Vercel dashboard → Project → Settings → Environment Variables → Preview tab before any seed |
| Execute pilot seed before environment is confirmed | Always confirm non-production environment classification first; block and document if uncertain |
| Claim pilot workflow passed with static audit only | Static audit + build = partial pass; live authenticated role tests are required for full pass |
| Leave temporary developer scripts untracked | Add to `.gitignore` or commit as utility; never leave ambiguous in working tree |
| Infer DB classification from 401 response | HTTP 401 proves auth protection only; DB classification requires Vercel dashboard inspection |
- Keep each task focused.
- Do not mix multiple features into one commit.

After implementation:
```bash
npx prisma generate
npx tsc --noEmit
npm run build
```

Before commit:
```bash
git diff --stat
```

Commit rules:
- Stage only files related to the current task.
- Use clear conventional commit messages:
  - `feat: ...`
  - `fix: ...`
  - `chore: ...`
  - `docs: ...`
  - `refactor: ...`
- Push to current branch after successful build.
- Confirm clean working tree:
```bash
git status
```

Final response must include:
- summary of what was implemented
- files changed
- commands run
- typecheck result
- build result
- commit message
- commit hash
- push status
- warnings/follow-up risks

---

## 13. Deployment Rules

Vercel deployment checklist:
1. Check latest commit deployed.
2. Check deployment status is Ready.
3. Check `/api/health/db`.
4. Confirm `DATABASE_URL` and `DIRECT_URL` are set in Production.
5. Confirm `OPENAI_API_KEY` is set in Production if AI features are used.
6. Confirm `EMBEDDING_MODEL` is set.
7. Redeploy after environment variable changes.
8. Do not assume old deployments use new env values.

If `/api/health/db` returns:
- host `base`: env is wrong or old deployment is used.
- host `db.<project>.supabase.co:5432`: direct connection is used; switch to Supabase pooler for Vercel.
- host `pooler.supabase.com:6543` and status ok: runtime DB is connected.

---

## 14. Production Readiness Gate

Do not proceed to new AI features unless all are true:

- `/api/health/db` returns ok.
- Prisma migrations have been applied.
- Supabase tables exist.
- `/dashboard` loads without production DB error.
- `/cases` loads without production DB error.
- `/library` loads without production DB error.
- Existing build passes.
- Git working tree is clean.

---

## 15. Task Execution Template

For every new task, follow this process:

1. Restate the task.
2. Inspect relevant files.
3. Propose a short plan if the task is risky.
4. Run `git status`.
5. Make focused changes.
6. Run required checks.
7. Commit and push if checks pass.
8. Provide final report.

Use this exact final report format:

```text
Summary:
Files changed:
Commands run:
Typecheck:
Build:
Database/migration impact:
Security/secrets impact:
Commit:
Commit hash:
Push:
Warnings / next steps:
```

---

## 16. Current Recommended Next Step

See `PROJECT_STATE.md` §12 for the definitive recommended next step.

Summary: **Prompt 48 — Pilot Data Seeding + Controlled Real-Case Trial**

Prerequisites:
- Intelligence baseline: completed (this prompt, Prompt 47.5)
- COMMISSIONER/VIEWER live UAT: partially blocked (documented gap)

---

## 17. UAT & Authorization Rules

- Authenticated UAT must verify backend API permission enforcement (e.g., `requireApiPermission`, `hasPermission`), not only UI visibility.
- Do not mark UAT passed unless each role was tested with an authenticated account (or the report explicitly states it was a static code audit).
- NextAuth middleware (`withAuth`) prevents unauthenticated access broadly, but granular authorization requires explicit role checks on every mutating API and sensitive page.
- Maintenance actions require POST, explicit permission checks, confirmation phrases for destructive actions, and audit logging.
- After fixing auth/permission issues, rerun production-like smoke tests.
- Permission hardening must start from the UAT gap register and fix only confirmed gaps.
- Backend API enforcement must be verified before UI hiding is considered sufficient.
- Mutation endpoints require explicit permission checks and structured unauthorized responses.
- Admin maintenance routes must remain POST-only for actions and must never execute actions during render/import.
- After permission changes, run build plus unauthenticated route smoke tests.
- Role UAT must test both page access and direct API challenge attempts for each role.
- A permission gap is not verified fixed until unauthenticated, unauthorized, and authorized paths are all tested.
- A route returning build-pass but runtime 500 must be treated as UAT failure.
- Sign-off packs must clearly distinguish tested roles from planned/blocked roles.
- Do not claim full UAT pass when some role accounts are unavailable; record as partial with explicit blocked items.
- `requireApiPermission` throws `"UNAUTHORIZED"` / `"FORBIDDEN"` rather than returning a `NextResponse`; API handlers must call it inside `try/catch` and map to 401/403.
- Static code audit + build validation is a valid but incomplete substitute for live authenticated UAT; always document the distinction.
- Do not run `prisma migrate deploy` inside the Vercel build command.
- Do not use `prisma db push --accept-data-loss` on staging or production.
- Do not write audit logs or database mutations during React Server Component render.
- Maintenance/archive actions must be POST-only, permission-protected, confirmation-protected, and audited.
- Do not expose secrets to the client or logs.
- Never commit `.env*` files or real secret values.
- Prisma Client is generated to the project-specific generated client path (`src/generated/prisma`).
- `requireApiPermission` throws `"UNAUTHORIZED"` / `"FORBIDDEN"` rather than returning `NextResponse`; API handlers must call it inside `try/catch` and map errors to 401/403.
- Pilot/live workflow remains blocked until staging DB and role accounts are manually verified.
- Archive execution UAT must verify unauthenticated, unauthorized, preview-only, execute-authorized, blocked-case, eligible-case, audit, reversal, and production-block paths.
- Production block must be verified separately from staging success.
- Archive is not ready for production if audit or reversal feasibility is unverified.
- UAT pass requires actual staging execution with pilot records; otherwise mark blocked/partial.

### Before starting work:
1. Read `SKILL.md` (this file)
2. Read `ARCHITECTURE.md` (if touching system structure, deployment, or tech stack)
3. Read `PROJECT_STATE.md` (always — to know where we are)
4. Read `DATABASE_SCHEMA.md` (if touching Prisma schema, migrations, or models)
5. Read `COMPONENT_MAP.md` (if adding/modifying routes, components, or API handlers)

### After completing work:
1. Update `PROJECT_STATE.md`: completed prompts table, module status, smoke test summary
2. Update `SKILL.md`: new lessons learned, new rules from solved problems
3. Update `ARCHITECTURE.md`: if system structure, modules, or deployment flow changed
4. Update `DATABASE_SCHEMA.md`: if schema changed, migration added, or model notes changed
5. Update `COMPONENT_MAP.md`: if routes, components, or API handlers added/removed/changed

### Quick validation:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-project-intelligence.ps1
```

---

## 18. Intelligence Files Update Rules

**Every future prompt must follow this protocol:**

| Execute pilot seed before environment is confirmed | Always confirm non-production environment classification first; block and document if uncertain |
| Claim pilot workflow passed with static audit only | Static audit + build = partial pass; live authenticated role tests are required for full pass |
| Leave temporary developer scripts untracked | Add to `.gitignore` or commit as utility; never leave ambiguous in working tree |
| Infer DB classification from 401 response | HTTP 401 proves auth protection only; DB classification requires Vercel dashboard inspection |
| Detect production via DATABASE_URL content | Use `NODE_ENV=production` for production detection in scripts; URL content is unreliable (staging also uses pooler) |
| Use `ALLOW_PRODUCTION_PILOT_SEED=YES` for staging | Use `ALLOW_STAGING_PILOT_SEED=YES` for staging; reserve production flag for production only |
| Assume seeded `@example.test` users can log in | Azure AD OAuth requires real Microsoft accounts; seed creates DB records only |
| Use `prisma db push` on staging/production | Use `prisma migrate deploy`. `db push` is for local disposable DBs only. |
| Read `.env*` without redacting logs | Terminal logs containing `.env` values must never be committed. |
| Write audit logs during retention page render | Retention pages must not mutate or audit during server component render. |

### Microsoft Graph Document Sync Rules (Prompt 63, 64 & 68 & 72 & 74)
- **DOCX/PDF parser spike UAT evidence must be sanitized and must not include raw IDs, tokens, secrets, raw URLs, full content, or real document names.**
- **Parser spike cannot move to official Document workflow until evidence pack is PASSED or approved CONDITIONAL PASS.**
- **Scanned/OCR/encrypted/macro files remain blocked.**
- **Production DOCX/PDF ingestion remains NO-GO.**
- File-type expansion requires a separate design gate before parser implementation.
- DOCX/PDF expansion remains design-only until parser/security approvals and staging UAT plan are complete.
- OCR/scanned PDFs/encrypted PDFs/macro files remain blocked.
- Official Document creation and RAG indexing remain separate future gates.
- Content ingestion prototype is staging-only and safe-test-files-only.
- First prototype supports only `.txt` and `.md`.
- PDF/DOCX/OCR/RAG require separate prompts.
- Full content must not be logged or exposed.
- Production content ingestion remains blocked.

- **Live Sync Disabled**: Live Microsoft Graph calls must be disabled in production unless a dedicated release gate is approved.
- **Owner Confirmation Required**: Do not implement or execute live connectivity tests without explicit owner confirmation of staging environments and safe test folders.
- **Metadata Dry Run Scope**: Metadata-only Graph dry runs must not download content, persist DB records, or index RAG.
- **Sanitization**: Dry-run responses must be sanitized and limited to prevent leaking secrets or raw identifiers.
- **Real Ingestion Blocked**: Real document ingestion requires separate staging UAT and owner approval.

| Implement mutating archive actions before UI previews | Dry-run preview endpoints must be POST-only, permission-protected, batch-limited, and non-mutating. UI preview panels must not expose execute controls until approved. Eligibility checks must be conservative when schema support is missing. |
| Mix preview and execution permissions | Preview permission (`PREVIEW_ARCHIVE`) and execution permission (`EXECUTE_ARCHIVE`) must be strictly separated. |
| Rely on UI hiding for security | UI permission visibility is not a substitute for backend API authorization. |
| Expose execute actions prematurely | Reserved execution permissions must not enable execution UI until the endpoint exists and UAT is complete. |
| Treat handoff as verified completion | Archive execution requires schema, permission, audit, reversibility, eligibility, and UAT gates before implementation. If any gate is missing, implement only documentation/planning, not execution. Archive migration planning must be separated from migration execution. Delete/purge remains out of scope unless separately approved. **Archive execution must re-run eligibility pre-mutation, not trust previous client preview checks.** **Staging-only execution must require an explicit environment gate flag.** **Production execution requires a separate release gate and must be blocked by default.** **Confirmation phrase and reason are required for archive execution.** |
| Code audit as UAT substitute | Code audit cannot substitute for live staging UAT. |
| Production release without staging execution | Production release gate must be NO-GO if staging execution did not run. |
| Runtime audit verification | Runtime audit verification is required before production archive release. |
| Reversal feasibility | Reversal feasibility must be tested, not only documented. |
| Microsoft Graph connectivity | Live connectivity must be staging-only and owner-confirmed. Token acquisition must never occur during render. Status endpoint must not acquire tokens. Connectivity endpoint must be POST-only, permission-protected, and sanitized. Document content ingestion requires a separate prompt and UAT. |
 
* Graph metadata persistence requires staging DB confirmation metadata-only schema and explicit persistence flag.
* Metadata persistence must store sanitized metadata/run records only.
* Raw tokens secrets raw Graph responses and document content must never be stored.
* Creating official Document records or RAG indexing requires a separate prompt and UAT.

* Metadata persistence UAT must verify read-only report routes, protected run history, no content download, no Document creation, and no RAG indexing.
* Dashboard/report routes must not call Graph live or mutate DB during render.
* Production Graph persistence remains blocked until separate release gate.

## Staging Operator Trial Rules (Prompt 71)
* Operator trial evidence must be sanitized and must not include raw IDs, secrets, tokens, full content, or real document names.
* Staging operator trial is required before any file-type expansion.
* Evidence pack status must distinguish PASSED, CONDITIONAL PASS, BLOCKED, and FAILED.
* Production content ingestion remains NO-GO after staging operator trial unless separate production release gate is approved.

## DOCX/PDF Parser Spike Rules (Prompt 73)
* DOCX/PDF parser spike is staging-only and fake-file-only.
* Searchable PDF only; OCR/scanned/encrypted PDFs remain blocked.
* Parser libraries must be server-side only and must not run during render.
* Full extracted content must not be logged or exposed.
* Production DOCX/PDF ingestion remains NO-GO.

## Graph Official Document Workflow Rules
- Official document workflow integration requires a design gate before implementation.
- Parser output must become a reviewable candidate before any official Document record.
- Candidate creation, review, promotion, case linkage, and RAG indexing are separate gates.
- No automatic case linkage.
- No automatic RAG indexing.

## Official Document Candidate Workflow (Prompt 76)
- Official document candidate workflow is staging-only and does not create official Document records.
- Candidate creation, review, staging promotion, production promotion, case linkage, and RAG indexing are separate gates.
- Candidate routes must never call Microsoft Graph or download content.
- Candidate review cannot approve production or RAG.
- Official Document creation remains blocked until future prompt.

## Prompt 77 Rules & Lessons
* Feature Freeze + Stabilization: During the pre-pilot phase, do not add new features, do not perform major refactors, and do not mutate the schema unless it is a critical blocker.
* Focus purely on stability, testing, and UX/bug fixes that directly unblock pilot operations.

## Prompt 78: Stabilization
- Remove all mock data from dashboards to avoid misleading stats in Pilot.
- Next.js 16 deprecated middleware file convention to proxy.
- Avoid nested React component definitions (e.g., StatusIcon inside page render) which causes state wipe on every re-render.
- Avoid sync setState inside useEffect loops to prevent cascading re-renders.


## Prompt 79 Pilot Testing Lessons
- DO NOT WRITE NEW FEATURES WITHOUT A PLAN. System is in Feature Freeze.
- ALWAYS PREFER isClosedOrRedCase FOR OVERDUE LOGIC. Thai legal systems have complex completed states.
- NEVER EXPOSE MOCK DATA ON PRODUCTION/PILOT.

## Prompt 80 Stabilization Rules & Lessons
- System Readiness Decision: Proceed with Path D (Pilot User SOP and Training Manual).
- Codebase is 100% ready for limited staging pilot with no critical blockers.
- Focus shifted to operational onboarding, Entra ID provision, and Vercel preview database separation.
- Defer Linter fixings (e.g. any types) until post-pilot to prevent regression.
- Next step logic (Prompt 81): Controlled Pilot SOP, Training Pack, and Acceptance Criteria.

## Prompt 81 Pilot SOP Rules & Lessons
- **Controlled Pilot Requirement**: A system without SOP, acceptance criteria, issue reporting, and stop criteria is not ready for real users, even if the code builds.
- **Stop/Rollback Criteria**: Must be strictly defined before a pilot begins to prevent data corruption or AI hallucination harm.
- **Manual Review**: All AI-assisted output in the pilot MUST require manual review by a responsible legal officer.
- **Training Agendas**: Must explicitly cover what the system CANNOT do (e.g., provide final legal judgment).
- **Next Step Logic (Prompt 82)**: Pilot Feedback Loop and Issue Triage System.

## Prompt 82 Pilot Feedback Loop & Triage Lessons
- **Feature Freeze Reinforcement**: Never add a new UI feature for issue tracking if a document or spreadsheet can accomplish the same goal during a Pilot.
- **Triage Discipline**: Strict categorization (Severity 1-5, Bug vs. Enhancement) is required to stop uncontrolled scope expansion.
- **Accuracy over Convenience**: If a workaround is annoying but safe, it remains a workaround until scheduled for a fix. Legal and data safety always win over UX convenience during stabilization.
- **Evidence-Based Prompts**: The next prompt (Prompt 83) should be entirely based on actual logged issues, not developer assumptions.


## Prompt 83 Pre-Pilot Batch Fix Lessons
- **Issue Fixing Rules**: Fix only issues directly scoped in the prompt (e.g., Red Number completion rule). Do not execute sweeping refactors (like fixing 1700 any-type warnings) during a Feature Freeze unless explicitly requested.
- **Data Integrity Consistency**: If a strict business rule exists (e.g., cases with red numbers must be considered closed), enforce it eagerly at the source (Data Import) AND ensure filter logic (DB Queries) perfectly mirrors memory logic (isClosedOrRedCase) to prevent reporting inflation.
- **Scope Control Reminder**: Defer large architectural asks (e.g. Graph Live Document Sync) that risk pilot stability.
 
  
 # #   P r o m p t   8 4   P i l o t   S i g n - O f f   L e a r n i n g s  
 -   * * S e l e c t e d   P a t h * * :   P a t h   F   ( P i l o t   R e a d i n e s s   R e v i e w   a n d   C o n t r o l l e d   L a u n c h   S i g n - O f f ) .  
 -   * * S t a b i l i z a t i o n   R u l e s * * :   O n l y   t r a n s i t i o n   t o   l a u n c h   s i g n - o f f   i f   b u i l d   p a s s e s ,   t y p e c h e c k   p a s s e s ,   v a l i d a t i o n   p a s s e s ,   a n d   N O   P 0 / P 1   i s s u e s   e x i s t .  
 -   * * C o n t r o l l e d   L a u n c h   L i m i t a t i o n s * * :   M u s t   r e q u i r e   m a n d a t o r y   h u m a n   l e g a l   r e v i e w   f o r   R A G   A I   f e a t u r e s .   D a s h b o a r d   d e p e n d e n c i e s   r e q u i r e   v a l i d a t e d   i m p o r t   m a p p i n g .   D O C X   t e m p l a t e s   a r e   c o n s i d e r e d   u n v e r i f i e d   d r a f t s   u n t i l   w e t - s i g n e d .  
 -   * * K n o w n   R e m a i n i n g   R i s k s * * :   V e r c e l   D B   P r e v i e w   c o n n e c t i v i t y   i s s u e s   ( P R E - 6 ) ,   T y p e S c r i p t   ` a n y `   t e c h   d e b t   ( P R E - 4 ) ,   M i c r o s o f t   G r a p h   l i v e   s y n c   p o s t - p i l o t   s c o p e   l i m i t   ( P R E - 5 ) .  
 -   * * F e a t u r e   F r e e z e   M a i n t e n a n c e * * :   N o   n e w   w o r k f l o w   m o d u l e s   w e r e   i m p l e m e n t e d   d u r i n g   s t a b i l i z a t i o n ,   a d h e r i n g   s t r i c t l y   t o   f r e e z e   p r o t o c o l s .  
   
## 12. Prompt 85: Controlled Launch Gate Rules  
- **Launch is not guaranteed**: Launch gate prompts must verify code build, Prisma validation, and safety rules before approving a launch.  

## 12. Prompt 85: Controlled Launch Gate Rules
- **Launch is not guaranteed**: Launch gate prompts must verify code build, Prisma validation, and safety rules before approving a launch.
- **No-Go Criteria**: If `npm run build` fails, or critical data integrity/safety issues exist, the launch must be aborted.
- **Pilot Scope**: This is a controlled internal pilot, not full production.
- **Launch Checklist**: Must verify Legal Q&A warning, DOCX restrictions, security, business logic, and actual code build success.

