# Archive Pilot Records Plan

## Objective
To safely test the archive execution functionality in the staging environment by using explicitly fake, non-production cases that cover all archive eligibility and block conditions.

## Record Categories and Requirements

| Category | Prefix/Identifier | Expected Archive Result | Notes |
|----------|-------------------|-------------------------|-------|
| 1. Eligible Closed Case | `PILOT_ARCHIVE_ELIGIBLE_001` | **Executed** (Status -> ARCHIVED) | Status is FINALIZED, no active meetings. |
| 2. Ineligible Active Drafting | `PILOT_ARCHIVE_BLOCKED_ACTIVE_001` | **Blocked** | Status is in active processing (e.g., REVIEW). |
| 3. Ineligible Pending Dispatch | `PILOT_ARCHIVE_BLOCKED_DISPATCH_001` | **Blocked** | Status is READY_TO_ARCHIVE but dispatch not completed/acked. |
| 4. Ineligible Legal Hold | `PILOT_ARCHIVE_BLOCKED_LEGAL_HOLD_001` | **Blocked** | If schema supports hold (e.g. RECORD_LIFECYCLE_STATUS=HOLD). |
| 5. Ineligible Missing Final Doc | `PILOT_ARCHIVE_BLOCKED_NO_DOC_001` | **Blocked** | FINALIZED status but no finalized document attached. |
| 6. Already Archived | `PILOT_ARCHIVE_BLOCKED_ALREADY_001`| **Blocked** | Status is ARCHIVED. |

## Rules
- **All pilot records must be completely synthetic.** No real names, no real case details, no real police data.
- **Environment Isolation:** Pilot seed script must strictly verify non-production environment and require `ALLOW_ARCHIVE_PILOT_SEED=YES` and `PILOT_SEED_CONFIRM=YES` before committing data.
- **Easy Cleanup:** All pilot cases will use the `PILOT_ARCHIVE_` prefix in the `blackNumber` field to allow safe and easy cleanup if necessary.

## Expected Outcomes
- **Dry-run Outcome**: The `seed-archive-pilot-records.ts` script should report exact quantities of records to create/update. No DB mutation should occur in dry-run mode.
- **Execute Preview Outcome**: The `archive/preview` endpoint must return the exact breakdown of eligible vs blocked cases, accurately reflecting the categories above.
- **Archive Execution Outcome**: The `archive/execute` endpoint must successfully archive only the eligible cases, record `previousStatusBeforeArchive`, write to `ArchiveBatch`, and log the action to `AuditLog`.
- **Reversal Outcome**: `previousStatusBeforeArchive` must be correctly populated, enabling future un-archiving workflows.
