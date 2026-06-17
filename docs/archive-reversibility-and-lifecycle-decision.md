# Archive Reversibility and Lifecycle Decision

## Overview
This document confirms the reversibility mechanics for the archive action to ensure destructive operations are not inadvertently performed.

## Lifecycle Analysis
1. **Does archive set a reversible status?** Yes, it updates `archiveStatus` and `lifecycleStatus` but retains the record.
2. **Does it create an immutable archive record?** No, `CaseArchiveRecord` can be updated.
3. **Can the original case status be restored?** Currently, the system overwrites `currentStatus`. To safely restore, we need a `previousStatusBeforeArchive` field.
4. **Is prior status stored anywhere?** Only in the audit log history, which is not easily queried for automatic restoration.
5. **Are linked documents preserved?** Yes, documents are not purged.
6. **Are search/reporting results affected?** Yes, typical queries filter out archived statuses, but executive reports can include them.
7. **Are RAG/library references affected?** Handled separately via `KnowledgeReuseReview`.
8. **Does archive block editing/drafting/finalization?** Yes, archived cases will fail validation guards on mutation endpoints.
9. **Can an admin reverse archive with audit?** The `unarchivedAt` and `unarchivedByUserId` fields exist in `CaseArchiveRecord`, signaling explicit support.
10. **Is legal hold supported?** Yes (`legalHold`, `legalHoldReason`).

## Decision
Archive must be strictly reversible. Since there is currently no `previousStatusBeforeArchive` field in the database schema, reversing an archive action would require manually parsing audit logs to determine the previous state. Execution is **NOT READY** until a reliable state-reversal mechanism (such as adding `previousStatusBeforeArchive`) is designed and implemented. Delete/purge actions remain out of scope.
