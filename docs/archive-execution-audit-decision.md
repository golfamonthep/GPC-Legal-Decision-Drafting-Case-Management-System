# Archive Execution Audit Decision

## Overview
This document evaluates the system's ability to maintain a robust, compliant audit trail for case archiving actions.

## Existing Audit Capabilities
- **Is there an audit log model?** Yes (`AuditLog`).
- **Is there a helper for audit writes?** Yes (`src/lib/audit.ts`).
- **Can audit logs record:**
  - **actor**: Yes (`userId`).
  - **action**: Yes (`action`).
  - **case IDs**: Yes (`entityId`).
  - **before state**: Yes (`beforeValue`).
  - **after state**: Yes (`afterValue`).
  - **dryRun vs executed**: No explicit support (must be encoded in `action` string or `afterValue`).
  - **reason**: Yes (via `afterValue` JSON).
  - **policy reference**: Yes (via `afterValue` JSON).
  - **timestamp**: Yes (`timestamp`).
  - **request metadata if safe**: Yes (via JSON strings).
- **Does audit logging avoid secret/private data?** Yes, by convention.
- **Are audit writes restricted to explicit POST actions?** Yes, server component writes are prohibited by architecture rules.
- **Is there a rollback/reversal audit concept?** Implicitly supported by logging a new event (e.g., `UNARCHIVE_CASE`).

## Decision
**CONDITIONALLY READY**. The generic `AuditLog` structure is sufficient to meet basic compliance requirements, but lacks native batch grouping (`archiveBatchId`) and explicit `dryRun` flags. Execution must carefully serialize these fields into the `beforeValue`/`afterValue` text fields or await schema enhancements.
