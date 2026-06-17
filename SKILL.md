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
- Next recommended step: **Prompt 48 — Pilot Data Seeding + Controlled Real-Case Trial**.
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
- After permission changes, run build plus unauthenticated route smoke checks.
- Role UAT must test both page access and direct API challenge attempts for each role.
- A permission gap is not verified fixed until unauthenticated, unauthorized, and authorized paths are all tested.
- A route returning build-pass but runtime 500 must be treated as UAT failure.
- Sign-off packs must clearly distinguish tested roles from planned/blocked roles.
- Do not claim full UAT pass when some role accounts are unavailable; record as partial with explicit blocked items.
- `requireApiPermission` throws `"UNAUTHORIZED"` / `"FORBIDDEN"` rather than returning a `NextResponse`; API handlers must call it inside `try/catch` and map to 401/403.
- Static code audit + build validation is a valid but incomplete substitute for live authenticated UAT; always document the distinction.

---

## 18. Intelligence Files Update Rules

**Every future prompt must follow this protocol:**

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
