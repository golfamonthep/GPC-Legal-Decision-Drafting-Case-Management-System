# Archive Action Design

## 1. Existing Model Support
- `CaseArchiveRecord` exists with `lifecycleStatus`, `archiveStatus`, `archiveReason`, `note`, `archivedAt`, `archivedByUserId`, `unarchivedAt`, `unarchivedByUserId`, `retentionReviewDate`, and `legalHold`.
- `Case` model has `currentStatus`.
- `KnowledgeReuseReview` exists for managing reuse workflows.
- `AuditLog` exists and can capture archiving actions.
- The schema largely supports basic archiving logic with reversal fields available (`unarchivedAt`, `unarchivedByUserId`).

## 2. Missing Schema Fields
- `retentionDueDate` (to strictly define destruction vs. review date).
- Specific `ArchiveActionAuditLog` if a standard `AuditLog` does not meet rigid compliance requirements (though `AuditLog` suffices for now).

## 3. Schema Completeness for Archive
- Archiving *can* be represented using existing models (`CaseArchiveRecord` fields `archiveStatus` = `COMPLETED`). 

## 4. New Schema Requirements
- No new schema is strictly required for this design phase. Existing models support the basic archive/unarchive transitions.

## 5. Archive Reversibility
- The archive action *is* reversible. The `unarchivedAt` and `unarchivedByUserId` fields exist, indicating that unarchiving is a supported design.

## 6. Impact on Sub-Systems
- **Documents**: Retained, not deleted. Potentially moved to a digital archive folder (`digitalArchiveFolderUrl`).
- **Cases**: State changes (`lifecycleStatus` to `ARCHIVED`), removed from active drafting queues.
- **Search**: Should remain searchable but flagged as archived.
- **Reports**: Included in historical reporting.
- **RAG/Library**: Depends on `KnowledgeReuseReview` status.

## 7. Audit Requirements
- Must write to `AuditLog`.
- Log must include `action` (e.g., "ARCHIVE_CASE"), `entityId` (case ID), `userId`, and `afterValue` (archive reason).

## 8. Permission Requirements
- Requires `MANAGE_RECORDS_ARCHIVE` or `ARCHIVE_CASE`. `MANAGE_RECORDS_RETENTION` is missing and should be mapped to `MANAGE_RECORDS_ARCHIVE`.

## 9. Archive Action Principles (Phase 4)
1. Archive is not delete.
2. Archive must be reversible unless law/policy says otherwise.
3. Archive must preserve audit trail.
4. Archive must not remove original records.
5. Archive must not purge documents.
6. Archive must require explicit permission.
7. Archive must require confirmation phrase.
8. Archive must support dry-run. **(Implemented: `POST /api/records-retention/archive/preview`)**
9. Archive must show impact preview before execution. **(Implemented: UI Panel in Records Retention)**
10. Archive must block if case is not eligible.
11. Archive must never run during GET/page render/import.
12. Archive must not affect non-selected records.
13. Archive must not expose confidential case details in logs.
  
## 10. Readiness Decision (Prompt 54)  
Archive execution is **NOT READY**.  
It is blocked by:  
1. Missing schema fields (previousStatusBeforeArchive for reversibility, rchiveBatchId for audit grouping).  
2. Missing granular permissions (PREVIEW_ARCHIVE, EXECUTE_ARCHIVE).  
Execution remains intentionally not implemented until these gates are addressed in future prompts. 
