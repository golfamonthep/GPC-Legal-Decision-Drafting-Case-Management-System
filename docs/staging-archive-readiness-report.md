# Staging Archive Readiness Report

**Prompt**: 61A
**Date**: 2026-06-17
**Status**: BLOCKED — Awaiting Staging DB Verification

## 1. Staging DB Status
- **Status**: UNKNOWN / BLOCKED
- **Evidence**: Vercel dashboard `DATABASE_URL` preview values have not been manually verified by the owner to confirm separation from production.
- **Action Required**: Owner must complete `docs/vercel-preview-env-checklist.md` to confirm the staging DB.

## 2. Staging Env Var Status
- **Status**: UNKNOWN / BLOCKED
- **Evidence**: `ALLOW_STAGING_ARCHIVE_EXECUTION=YES` needs to be set for the staging environment (e.g. locally or in Preview scope) to permit staging execution. Production must NOT have this flag.
- **Action Required**: Owner must configure env vars appropriately.

## 3. Staging Migration Status
- **Status**: BLOCKED
- **Evidence**: Prisma schema was updated in Prompt 55 but no migration file was generated because local dev DB was unavailable.
- **Action Required**: A migration must be generated and applied manually using `DIRECT_URL=<staging-direct-url> npx prisma migrate deploy` (or `dev` on a separate dev DB first).

## 4. Pilot Record Status
- **Status**: PLANNED
- **Evidence**: `docs/archive-pilot-records-plan.md` outlines the safe pilot records to be seeded. `scripts/seed-archive-pilot-records.ts` is available to execute in dry-run mode.
- **Action Required**: Run the seed script in execute mode once the staging DB is confirmed and schema is migrated.

## 5. Role Account Status
- **Status**: BLOCKED
- **Evidence**: Live Microsoft accounts assigned to appropriate roles (`EXECUTE_ARCHIVE`, `PREVIEW_ARCHIVE`, `VIEW_RECORDS_RETENTION`) have not been verified in the staging DB.
- **Action Required**: See `docs/archive-staging-role-account-checklist.md` for required accounts to provision and test.

## 6. Archive Execution Env Gate Status
- **Status**: ACTIVE
- **Evidence**: The archive execution endpoint blocks execution unless the environment is explicitly configured for staging testing.
- **Action Required**: Provide appropriate flags to unblock in staging.

## 7. Runtime Audit Verification Readiness
- **Status**: PREPARED
- **Evidence**: Schema and endpoint logic support full audit logging (`archiveBatchId`, `previousStatusBeforeArchive`).
- **Action Required**: Execute the pilot data flow and verify the audit records manually.

## 8. Blockers
- Staging DB separation not confirmed.
- Schema migrations not applied to staging.
- Live test accounts not available.

## 9. GO/NO-GO for Prompt 61B live staging UAT
- **Decision**: NO-GO (BLOCKED until verified)
