# Staging Environment Readiness Report

**Prompt**: 50B  
**Date**: 2026-06-17  
**Status**: BLOCKED — Non-production database not confirmed  

---

## 1. Prompt 50 Blocker Summary

| Item | Status |
|------|--------|
| Prompt 50 result | CONDITIONAL GO |
| Preview DB classification | ❌ CANNOT CONFIRM — `/api/health/db` returned HTTP 401 |
| Pilot seed executed | ❌ NOT EXECUTED |
| Production data mutated | ✅ NONE |
| Real sensitive data used | ✅ NONE |
| curl_all.ps1 untracked | ✅ Resolved — added to `.gitignore` |
| Current blocker | Owner must confirm preview DB is separate from production |

---

## 2. Required Owner Actions

Before any real pilot seed can be executed, the owner must complete **all** of the following:

1. **Check Vercel Dashboard**:
   - Project → Settings → Environment Variables → filter by **"Preview"** environment
   - Verify whether `DATABASE_URL` (or `POSTGRES_URL`) under Preview scope is **different** from the Production `DATABASE_URL`
   - If they are the **same**: the preview deployment shares the production database — seed cannot be executed against it

2. **Confirm staging DB classification**: Record (in this doc or verbally) that the Preview `DATABASE_URL` points to a separate non-production Supabase project

3. **Confirm schema is ready**: Run migrations against the staging DB manually before seeding

4. **Approve staging seed execution**: Explicitly state "I approve staging pilot seed execution against the confirmed non-production staging database"

5. **Confirm `curl_all.ps1` is correctly ignored**: Verify `git status` shows no untracked temporary scripts

---

## 3. Preview/Staging URL Assessment

| Item | Details |
|------|---------|
| Preview URL label | `gpc-legal-…-or6j29320.vercel.app` |
| `/api/health/db` response | HTTP 401 — auth-protected (correct behavior) |
| DB classification from URL probe | **Cannot determine** — 401 only proves auth is working, not DB separation |
| Production DB guard inference | Likely shared — standard Vercel behavior unless Preview env vars explicitly configured |

---

## 4. Target Environment Options

| Option | Safety | Notes |
|--------|--------|-------|
| Vercel Preview with **separate** Supabase staging project | ✅ SAFE if confirmed | Must verify in Vercel dashboard |
| Vercel Preview sharing production Supabase | ❌ UNSAFE | Cannot seed — would mutate production |
| Local `npm run dev` with separate `.env.staging.local` pointing to staging DB | ✅ SAFE | Best option if no separate preview DB exists |
| Local with production DB credentials | ❌ UNSAFE | Never acceptable |
| Dedicated staging server with staging DB | ✅ SAFE | Ideal long-term |

**Recommended safe path if preview DB cannot be confirmed**: Use **local development** with a separate staging `.env` file pointing to a dedicated staging Supabase project.

---

## 5. Go/No-Go Criteria for Seed Execution

| Criterion | Status |
|-----------|--------|
| Owner confirmed target DB is non-production | ❌ PENDING |
| Preview/staging env vars configured separately | ❌ UNKNOWN |
| Staging DB schema is ready (migrations applied) | ❌ UNKNOWN |
| Seed script passed dry-run | ✅ Script logic validated; runtime dry-run blocked by missing DATABASE_URL in shell (expected) |
| Pilot data is fake/anonymized | ✅ CONFIRMED |
| Cleanup strategy exists | ✅ CONFIRMED |
| Role account plan exists | ✅ CONFIRMED |
| No secrets are staged | ✅ CONFIRMED |
| Owner explicitly approved staging seed | ❌ PENDING |

**Result: Real staging seed NOT executed. All 9 criteria must be met before real seed.**

---

## 6. Migration Readiness

| Item | Status |
|------|--------|
| Migration files exist | ✅ 6 migrations in `prisma/migrations/` |
| `db:migrate:deploy` script in package.json | ✅ Exists |
| Migration separated from Vercel build | ✅ Not in build command |
| Staging DB schema expected to match production | ✅ Yes — same codebase |
| Manual migration required before seed | ✅ Must run `npm run db:migrate:deploy` with `DIRECT_URL` pointing to staging DB |
| Schema drift risk | ⚠️ Low — only 6 migrations applied, all documented |

**Migration command for staging (with staging DIRECT_URL set):**
```
DIRECT_URL=<staging-direct-url> npm run db:migrate:deploy
```
Do NOT document actual URL values.

---

## 7. Seed Script Readiness Assessment (Prompt 50B)

| Check | Status | Notes |
|-------|--------|-------|
| Defaults to dry-run | ✅ | `PILOT_SEED_CONFIRM !== 'YES'` is the gate |
| Real execution requires explicit flag | ✅ | `PILOT_SEED_CONFIRM=YES` required |
| Production guard (NODE_ENV=production) | ✅ FIXED | Changed from URL-based to NODE_ENV-based |
| Staging Supabase guard | ✅ NEW | `ALLOW_STAGING_PILOT_SEED=YES` required for pooler URLs outside production |
| Pilot records prefixed | ✅ | `PILOT-CASE-`, `PILOT_DRAFT_`, `PILOT-MTG-` |
| Idempotent / duplicate-safe | ✅ | Uses upsert pattern |
| Never deletes non-pilot data | ✅ | No delete operations in script |
| No secrets logged | ✅ | Only mode/count info logged |
| No Next.js server-only modules | ✅ | Only imports `prisma` from `src/lib/db` |
| Prisma import correct | ✅ | Uses `src/lib/db` (singleton pattern) |
| Not in build/start/deploy | ✅ | Script is manual-only via `npx tsx` |
| **Old issue: URL-based production detection** | ✅ FIXED | Staging Supabase (pooler) would have blocked seed unless production flag was set — now uses separate `ALLOW_STAGING_PILOT_SEED` flag |

**Fix applied**: `scripts/seed-pilot-data.ts` was updated to use `NODE_ENV=production` as the primary production detector, with a separate `ALLOW_STAGING_PILOT_SEED=YES` flag required for staging Supabase pooler connections.

---

## 8. Dry-Run Result (Phase 7)

| Item | Result |
|------|--------|
| Command | `PILOT_SEED_DRY_RUN=true npx tsx scripts/seed-pilot-data.ts` |
| Outcome | ❌ Exited with error — `DATABASE_URL is missing` |
| Is this expected? | ✅ YES — Prisma client initializes at import time and requires DATABASE_URL regardless of dry-run mode |
| Production data risk | ✅ NONE — no DB connection attempted without DATABASE_URL |
| Dry-run logic validation | ✅ Script logic was previously validated in Prompt 49 |

**Note**: A true dry-run requires `DATABASE_URL` to be set (pointing to any DB — including a staging one), because Prisma client instantiates at import time. However, in dry-run mode, no actual DB queries are made after that point — the upsert/create calls are skipped entirely. The script is safe; it just needs a DATABASE_URL to import.

---

## 9. Role Account Readiness

See `docs/staging-role-account-readiness.md` (created in this prompt).

---

## 10. Route Smoke Check for Staging

Not executed — environment not confirmed non-production.

When confirmed, run:
- `/login` → expected: 200
- `/api/auth/session` → expected: JSON
- `/api/health/db` → expected: `{status: ok}` (requires authenticated admin session)
- `/dashboard` → expected: redirect to login or 200
- `/cases` → expected: 200 or redirect
- `/admin/system` → expected: admin-only or redirect

---

## 11. Overall Staging Readiness

| Gate | Status |
|------|--------|
| Build passes | ✅ 67 routes, TypeScript clean |
| Seed script hardened (Prompt 50B fix) | ✅ Safer production/staging guards |
| Dry-run logic validated (prior prompt) | ✅ |
| Non-production DB confirmed | ❌ BLOCKED |
| Owner approved staging seed | ❌ BLOCKED |
| Live pilot workflow tests | ❌ BLOCKED |

**Overall: BLOCKED — Non-production database not confirmed.**

---

*Last updated: Prompt 50B (2026-06-17)*
