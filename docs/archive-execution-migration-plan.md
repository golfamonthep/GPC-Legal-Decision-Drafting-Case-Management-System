# Archive Execution Migration Plan

## Overview
This document outlines the database schema changes required to safely support archive execution, reversibility, and batch auditing. 
**Note**: The schema models were added in Prompt 55, but the SQL migration generation was skipped due to lack of a local disposable database. A manual migration plan is documented in `docs/archive-retention-migration-manual-plan.md`.

## Recommended Schema Changes

### 1. Case Archive State Fields
**Target Model**: `CaseArchiveRecord`
**New Fields**:
- `previousStatusBeforeArchive` (`String?`): Stores the `Case.currentStatus` right before archiving. **Why**: Critical for safe reversal (`unarchive`).
- `archiveBatchId` (`String?`): A UUID linking multiple records archived in the same transaction. **Why**: Critical for auditing batch actions.

### 2. Retention Review Fields
**Target Model**: `CaseArchiveRecord`
**New Fields**:
- `retentionDueAt` (`DateTime?`): The date when the record is scheduled for destruction or formal transfer. **Why**: Differentiates the hard retention deadline from the `retentionReviewDate`.

### 3. Archive Action Audit / Batch Log
**Target Model**: `ArchiveBatch` (New Model)
**Fields**:
- `id` (`String` @id)
- `dryRun` (`Boolean` @default(false))
- `executedByUserId` (`String?` -> `User`)
- `executedAt` (`DateTime` @default(now()))
- `confirmationHash` (`String?`): A hashed or sanitized marker indicating the confirmation phrase was successfully provided. **Why**: Audits that the mandatory confirmation step was passed, without logging sensitive raw phrases.
- `resultStatus` (`String`): e.g., `SUCCESS`, `PARTIAL`, `FAILED`.

## Migration Risk Assessment
- **Risk Level**: Low. Adding nullable fields to `CaseArchiveRecord` and new `ArchiveBatch` models is fully backwards-compatible and non-destructive.
- **Data Backfill Requirement**: Existing `CaseArchiveRecord` rows can remain with null values for the new fields since archive execution has not yet run.
- **Staging Migration Test**: Must be tested in the staging environment before production deployment. A manual migration plan must be followed.
- **Rollback Plan**: Standard `prisma migrate resolve` or a down-migration script if the new fields cause unexpected application behavior, though this is highly unlikely.
