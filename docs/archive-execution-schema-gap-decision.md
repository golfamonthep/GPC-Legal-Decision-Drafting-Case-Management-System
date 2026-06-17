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
- **retentionStatus**: Missing.
- **retentionDueAt**: Missing (only has `retentionReviewDate`).
- **retentionReviewedAt**: Missing.
- **legalHold**: Supported.
- **isArchived**: Missing (implied via `archiveStatus`).
- **archiveBatchId**: Missing.
- **previousStatusBeforeArchive**: Missing (needed for safe reversal).

## Eligibility Validation Schema Support
Several eligibility rules rely on conservative checks returning `SCHEMA_SUPPORT_MISSING` because the schema lacks direct fields to easily confirm the absence of pending follow-ups, unresolved data quality issues, or completion of required final documents.

## Decision
**CONDITIONALLY READY**. While `CaseArchiveRecord` exists and basic transitions are possible, safe enterprise execution requires `retentionDueAt` (destruction date vs review date), `previousStatusBeforeArchive` (for safe reversal), and `archiveBatchId` for bulk audit correlation.
