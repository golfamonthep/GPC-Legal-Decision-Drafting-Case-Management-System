# Archive Execution Implementation Roadmap

## Overview
This roadmap defines the sequential sequence of prompts required to safely implement full archive execution, ensuring strict adherence to the project's security and architecture rules.

## Roadmap Sequence

### Prompt 55: Add Archive/Retention Schema Migration Plan and Prisma Model Updates
- **Objective**: Implement the schema changes defined in `archive-execution-migration-plan.md`.
- **Allowed Changes**: Prisma schema file, creating a new migration.
- **Prohibited Changes**: No API or UI logic changes. No `prisma db push` on staging/production.
- **Verification**: `npm run build`, `prisma generate`.
- **Rollback Criteria**: Schema compilation failure or backward incompatibility.

### Prompt 56: Add Dedicated Records Retention Permissions and Role Mapping
- **Objective**: Implement the permissions defined in `archive-execution-permission-plan.md`.
- **Allowed Changes**: `src/lib/auth/permissions.ts`, updating existing API/UI route guards.
- **Prohibited Changes**: No new routes or mutation endpoints.
- **Verification**: Ensure all existing tests pass and typechecks succeed.
- **Rollback Criteria**: Broken existing role mappings.

### Prompt 57: Implement Archive Execution Endpoint — Staging Only, Dry-Run Required First
- **Objective**: Build the `POST /api/records-retention/archive` execution endpoint.
- **Allowed Changes**: API route handler, core archiving transaction logic (updating status, logging batch, creating audit logs).
- **Prohibited Changes**: No execution against production DB. No frontend UI exposing the button yet.
- **Verification**: Endpoint unit logic, proper handling of `previousStatusBeforeArchive`, checking `EXECUTE_ARCHIVE` permission.
- **Rollback Criteria**: Transaction safety failures, missing audit logs.

### Prompt 58: Archive Execution UI — Confirmation, Impact Preview, and Audit Result
- **Objective**: Connect the frontend ArchivePreviewPanel to the execution endpoint.
- **Allowed Changes**: React components in `/records-retention`, adding confirmation phrase modal, error handling.
- **Prohibited Changes**: No bypassing the confirmation phrase requirement.
- **Verification**: Button state, modal flow, API error mapping.
- **Rollback Criteria**: UI crashes or state mismatches.

### Prompt 59: Archive Execution UAT and Rollback/Reversal Verification
- **Objective**: Fully test the end-to-end archiving flow and build the `UNARCHIVE` capability.
- **Allowed Changes**: Reversal API endpoint, UI toggle for unarchiving, documentation.
- **Prohibited Changes**: No mutating production data.
- **Verification**: Live UAT across roles. Confirming previous status is accurately restored.
- **Rollback Criteria**: Reversal fails to restore accurate `currentStatus`.

### Prompt 60: Production Archive Release Gate and Operator SOP
- **Objective**: Finalize readiness for production usage and publish standard operating procedures (SOP).
- **Allowed Changes**: Runbooks, README updates, readiness reports.
- **Prohibited Changes**: No code changes.
- **Verification**: All gates passed.
- **Rollback Criteria**: N/A (Documentation phase).
