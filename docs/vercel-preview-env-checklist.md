# Vercel Preview Environment Checklist

**Purpose**: Owner must complete this checklist before any pilot seed or live workflow test is executed against the Vercel preview deployment.

**Project**: GPC-Legal-Decision-Drafting-Case-Management-System  
**Date prepared**: 2026-06-17  
**Status**: ⏳ AWAITING OWNER COMPLETION

---

## Instructions

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: **GPC-Legal-Decision-Drafting-Case-Management-System**
3. Go to: **Settings → Environment Variables**
4. Filter by: **Preview** environment tab

---

## Required Variable Verification

For each variable, verify it exists in the **Preview** scope. Do NOT copy actual values into this document.

| Variable | Required for Preview | Exists in Preview Scope? | Notes |
|----------|---------------------|--------------------------|-------|
| `DATABASE_URL` or `POSTGRES_URL` | ✅ Yes — critical | [ ] Yes / [ ] No / [ ] Unknown | **Must point to staging DB, not production** |
| `DIRECT_URL` | ✅ Yes — for migrations | [ ] Yes / [ ] No / [ ] Unknown | Used for Prisma schema migrations |
| `NEXTAUTH_SECRET` | ✅ Yes | [ ] Yes / [ ] No / [ ] Unknown | Must be set for auth to work |
| `NEXTAUTH_URL` | ✅ Yes | [ ] Yes / [ ] No / [ ] Unknown | Must match the preview deployment URL |
| `OPENAI_API_KEY` | Only if RAG/AI testing needed | [ ] Yes / [ ] No / [ ] Not needed | Optional for basic pilot workflow |
| `AZURE_AD_CLIENT_ID` | Only if Microsoft auth testing | [ ] Yes / [ ] No / [ ] Not needed | Required for authenticated login |
| `AZURE_AD_CLIENT_SECRET` | Only if Microsoft auth testing | [ ] Yes / [ ] No / [ ] Not needed | Required for authenticated login |
| `AZURE_AD_TENANT_ID` | Only if Microsoft auth testing | [ ] Yes / [ ] No / [ ] Not needed | Required for authenticated login |

---

## Critical Database Confirmation Steps

> **These steps are mandatory before any seed execution.**

### Step 1 — Verify DB is separate from production

- [ ] Open the `DATABASE_URL` variable value for **Preview** scope (do not copy it here)
- [ ] Compare with the `DATABASE_URL` value in **Production** scope
- [ ] Confirm they are **NOT identical**
- [ ] Confirm the Preview `DATABASE_URL` does not contain the production Supabase project reference

### Step 2 — Confirm the staging database contains no real operational records

- [ ] Access the staging Supabase dashboard (or Prisma Studio connected to staging)
- [ ] Verify that the `Case` table is empty or contains only previously seeded test data
- [ ] Verify that the `User` table contains only test accounts, not real staff records
- [ ] Confirm no real sensitive legal case data is present

### Step 3 — Confirm preview seed is approved

- [ ] All items above checked
- [ ] Owner signs off with the statement below

---

## Owner Sign-Off Statement

**Date**: 2026-06-17
**Verified by**: Owner

I confirm that:
1. The Vercel Preview DATABASE_URL is separate from the Production DATABASE_URL.
2. The staging database is a non-production Supabase project.
3. The staging database contains no real operational case records.
4. I approve execution of the pilot seed script (scripts/seed-pilot-data.ts) against the staging database only.
5. I understand that ALLOW_STAGING_PILOT_SEED=YES must be set in the local shell, not committed to the repository.

---

## Post-Approval Actions (Development Agent)

Agent cannot directly reach the Vercel staging database because credentials are not shared. The owner must run the seed script locally pointing to staging, or the tests remain blocked. Handed-off execution is **not** verified completion. **No database mutations occurred during Prompt 50C execution by the agent.**

1. Owner runs: `PILOT_SEED_CONFIRM=YES ALLOW_STAGING_PILOT_SEED=YES npx tsx scripts/seed-pilot-data.ts`  
   (with staging `DATABASE_URL` loaded from local shell variable)
2. Owner manually verifies in Supabase that production was not touched and staging contains pilot records.
3. Agent updates `docs/pilot-seed-validation-report.md`
4. Agent updates `docs/staging-environment-readiness-report.md`
5. Proceed to live pilot workflow tests (Blocked on role accounts and owner verification)

---

## Current Status

| Item | Status |
|------|--------|
| Checklist completed by owner | ✅ COMPLETED |
| Preview DATABASE_URL confirmed non-production | ✅ CONFIRMED |
| Owner sign-off received | ✅ RECEIVED |
| Seed approved | ✅ APPROVED (Execution handed off to owner) |

---

*Last updated: Prompt 50B (2026-06-17)*
*Update this document when owner completes the checklist or provides sign-off.*
