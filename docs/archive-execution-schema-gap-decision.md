# Archive Execution Schema Gap Decision

## Overview
This document evaluates the current database schema to determine if it can safely support archive execution workflows without adding new fields or models.

## Case-level Support
- **status**: Partially supported (uses `currentStatus`).
- **finalization status**: Partially supported (derived from `currentStatus` / `lifecycleStatus`).
- **red number / red case number**: Supported (`redNumber`).
- **closed status**: Partially supported (checked via `currentStatus === 'ปิดคดี'`).
- **assigned user/owner**: Supported (`ownerId`, `legalOfficerId`).
- **createdAt**: Supported.
- **updatedAt**: Supported.

## Archive Support (`CaseArchiveRecord`)
- **CaseArchiveRecord**: Supported.
- **archivedAt**: Supported.
- **archivedBy**: Supported (as `archivedByUserId`).
- **archiveReason**: Supported.
- **archiveStatus**: Supported.
- **archivePolicyReference**: Partially supported (uses `retentionPolicyId`, lacks string reference).
- **retentionStatus**: Supported (added in Prompt 55).
- **retentionDueAt**: Supported (added in Prompt 55).
- **retentionReviewedAt**: Supported (added in Prompt 55).
- **legalHold**: Supported.
- **isArchived**: Missing (implied via `archiveStatus`).
- **archiveBatchId**: Supported (added in Prompt 55).
- **previousStatusBeforeArchive**: Supported (added in Prompt 55).

## Eligibility Validation Schema Support
Several eligibility rules rely on conservative checks returning `SCHEMA_SUPPORT_MISSING` because the schema lacks direct fields to easily confirm the absence of pending follow-ups, unresolved data quality issues, or completion of required final documents.

## Decision
**READY (from Schema Perspective)**. In Prompt 55, `retentionDueAt`, `previousStatusBeforeArchive` (for safe reversal), and `archiveBatchId` for bulk audit correlation were successfully added to `CaseArchiveRecord` along with the `ArchiveBatch` model. 

*Note: Execution remains intentionally unimplemented until a staging migration and corresponding permission checks are fully deployed.*
