# Staging Database Setup Guide

**Purpose**: Instructions for establishing a confirmed non-production staging environment for pilot workflow testing.  
**Date**: 2026-06-17  
**Status**: REFERENCE GUIDE — Not yet executed

---

## Option A: Vercel Preview with Separate Supabase Staging Project (Recommended)

### Step 1 — Create a staging Supabase project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project (e.g., `gpc-legal-staging`)
3. Select a region (prefer same region as production for realistic performance)
4. Note the project reference ID — do NOT document it here

### Step 2 — Enable required extensions

In the staging Supabase SQL editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
This is required for the `DocumentChunk.embedding` column.

### Step 3 — Configure Vercel Preview environment variables

1. Open Vercel Dashboard → Project → Settings → Environment Variables
2. Add the following variables **scoped to Preview only** (not Production):
   - `DATABASE_URL` → staging transaction-mode pooler URL
   - `DIRECT_URL` → staging session-mode pooler URL (port 5432)
   - `NEXTAUTH_SECRET` → a staging-only secret (different from production)
   - `NEXTAUTH_URL` → the Vercel preview deployment base URL
   - Other variables as needed (OPENAI_API_KEY, Azure AD vars)
3. **Do NOT reuse production credentials** for any staging variable

### Step 4 — Apply Prisma migrations to staging

On your local machine, with staging credentials loaded in shell (NOT committed to any file):

```powershell
# Set staging DIRECT_URL in your shell session (do NOT commit this value)
$env:DIRECT_URL = "<staging-direct-url>"
$env:DATABASE_URL = "<staging-database-url>"

# Apply all migrations
npm run db:migrate:deploy
```

Verify migrations applied in Supabase dashboard → Table Editor.

### Step 5 — Verify staging DB health

After a preview deployment with staging env vars:
1. Log into the preview deployment with a staging admin account
2. Navigate to `/api/health/db` (authenticated)
3. Confirm: `status: ok, canConnect: true`
4. Confirm host shows staging Supabase pooler (different from production host)

### Step 6 — Keep staging data fake/anonymized

- Only use `PILOT-` and `PILOT_` prefixed records
- Use `@example.test` email domains for test users
- Never import real case data into staging without explicit approval and anonymization

### Step 7 — Confirm non-production status

Record confirmation in `docs/vercel-preview-env-checklist.md` (owner sign-off required).

---

## Option B: Local Development with Staging Database

If no separate Vercel preview DB exists, use a local dev server connected to a staging DB.

### Step 1 — Create `.env.staging.local` (git-ignored)

```
# .env.staging.local — DO NOT COMMIT
DATABASE_URL=postgresql://postgres.<staging-ref>:<password>@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.<staging-ref>:<password>@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=<staging-only-secret>
NEXTAUTH_URL=http://localhost:3000
```

Ensure `.env.staging.local` matches the `.env*` pattern in `.gitignore`.

### Step 2 — Load staging env and run dev server

```powershell
# Copy staging env values to .env (or load them directly in shell)
# Start dev server
npm run dev
```

### Step 3 — Apply migrations to staging DB

```powershell
$env:DIRECT_URL = "<staging-direct-url>"
npm run db:migrate:deploy
```

### Step 4 — Run pilot seed against staging

Once DB is confirmed non-production and migrations applied:

```powershell
$env:DATABASE_URL = "<staging-database-url>"
$env:PILOT_SEED_CONFIRM = "YES"
$env:ALLOW_STAGING_PILOT_SEED = "YES"
npx tsx scripts/seed-pilot-data.ts
```

Do NOT set `ALLOW_PRODUCTION_PILOT_SEED=YES` — that flag is reserved for production-level authorization only.

---

## Seed Execution Flags Reference

| Flag | Purpose | Safe to set for staging? |
|------|---------|--------------------------|
| `PILOT_SEED_CONFIRM=YES` | Enables real seed execution (exits dry-run mode) | ✅ Yes — required for staging |
| `ALLOW_STAGING_PILOT_SEED=YES` | Required when DATABASE_URL contains "pooler" outside production NODE_ENV | ✅ Yes — for staging Supabase |
| `ALLOW_PRODUCTION_PILOT_SEED=YES` | Overrides production block | ❌ NEVER set for staging — production only |
| `PILOT_SEED_DRY_RUN=true` | Forces dry-run mode regardless of other flags | ✅ Always safe |

---

## Staging DB Existence Confirmation

| Item | Status |
|------|--------|
| Staging Supabase project created | ❌ UNKNOWN — owner must confirm |
| Staging DATABASE_URL configured in Vercel Preview scope | ❌ UNKNOWN |
| Migrations applied to staging DB | ❌ UNKNOWN |
| `CREATE EXTENSION vector` applied | ❌ UNKNOWN |
| Staging DB health verified | ❌ UNKNOWN |

**Update this table once owner confirms staging setup.**

---

*Last updated: Prompt 50B (2026-06-17)*
*Update when staging DB is created and confirmed.*
