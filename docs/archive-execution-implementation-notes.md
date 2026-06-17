# Archive Execution Implementation Notes

## Phase 2 Findings

### 1. Archive State Fields
Archive state is tracked primarily in the `CaseArchiveRecord` model. Fields include `archiveStatus`, `archiveReason`, `note`, `archivedAt`, `archivedByUserId`, `retentionDueAt`, and `previousStatusBeforeArchive`. The `Case` model itself has `currentStatus`.

### 2. State Preservation
The `CaseArchiveRecord` model was updated in Prompt 55 to include `previousStatusBeforeArchive` to allow safe reversibility.

### 3. Batch and Item Models
The `ArchiveBatch` and `ArchiveBatchItem` models were introduced to track batch execution actions.

### 4. Permission Requirements
The code currently uses `PREVIEW_ARCHIVE` for the dry-run endpoint. For execution, `ARCHIVE_CASE` (or `MANAGE_RECORDS_ARCHIVE`) exists in `permissions.ts`. We will use `ARCHIVE_CASE` as the primary execution permission.

### 5. Audit Utility
We can use direct Prisma `auditLog.create` calls or existing audit helpers to record actions safely without exposing raw case facts. We will also use `ArchiveBatch` and `ArchiveBatchItem` as the structured audit trail.

### 6. Dry-Run Reuse
The `evaluateArchiveEligibility` function in `archivePreview.ts` is exported and can be reused to perform an eligibility re-check before any database mutation occurs in the execution service.
