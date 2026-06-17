# Archive Execution Readiness Decision

## Decision: NOT READY

## Overview
Based on a comprehensive review of the current schema, permission structure, audit capabilities, and reversibility mechanisms, the archive execution feature is **NOT READY** for controlled implementation. While the dry-run preview endpoints and read-only UI successfully establish safety boundaries, critical gaps exist that prevent safe execution and reversibility.

## Required Conditions Checklist
- [x] Read-only records retention UI exists
- [x] Dry-run preview endpoint exists
- [x] Dry-run UAT passed or is clearly testable
- [x] No delete/purge is included
- [x] Staging/non-production testing path exists
- [ ] Dedicated manage permission exists (Current: Missing `PREVIEW_ARCHIVE`, `VIEW_ARCHIVE_AUDIT`)
- [ ] Audit model/helper can record archive execution (Current: Lacks explicit `dryRun` and `archiveBatchId` capabilities)
- [ ] Eligibility rules can be evaluated sufficiently (Current: `SCHEMA_SUPPORT_MISSING` for pending documents and data quality rules)
- [ ] Archive is reversible or policy decision documented (Current: Missing `previousStatusBeforeArchive` to safely revert state)
- [ ] No Severity A/B permission gaps remain (Current: Open permission gaps must be resolved)

## Blocking Items
1. **Schema Reversibility Gap**: Reversing an archive requires reverting `Case.currentStatus`. Without a `previousStatusBeforeArchive` field on `CaseArchiveRecord`, the system cannot safely unarchive a case to its original state.
2. **Batch Audit Linkage Gap**: Archiving multiple records requires bulk traceability. The `AuditLog` model lacks an `archiveBatchId` to correlate a bulk action.
3. **Data Quality / Completion Rule Gap**: The schema cannot efficiently evaluate whether all required documents are linked or specific data quality tasks are pending without complex relational joining or new explicit status fields. The dry-run currently defaults to `SCHEMA_SUPPORT_MISSING`.
4. **Permission Granularity Gap**: `MANAGE_RECORDS_ARCHIVE` is used broadly for both preview and settings. Dedicated `PREVIEW_ARCHIVE`, `EXECUTE_ARCHIVE`, `REVERSE_ARCHIVE`, and `VIEW_ARCHIVE_AUDIT` permissions should be introduced.

## Next Steps
1. Execute a schema migration to add the missing fields (`archiveBatchId`, `previousStatusBeforeArchive`, `retentionDueAt`).
2. Add dedicated permissions to the `PERMISSIONS` matrix and assign them.
3. Once gaps are addressed, implement the actual POST action behind the execution button.
