# Admin Maintenance Actions

This document outlines the safety and verification procedures for the system maintenance actions available in the Admin Console.

## Available Actions & Risk Levels

1. **Recheck System Health** (Low Risk)
   - **Dry Run**: Optional but defaults to True.
   - **Confirmation**: None.
   - **Behavior**: Retrieves database and environment readiness checks without executing destructive logic.

2. **Refresh Readiness Snapshot** (Low Risk)
   - **Dry Run**: Optional but defaults to True.
   - **Confirmation**: None.
   - **Behavior**: Same as health check, focuses on environment configs (OpenAI, Microsoft Graph, etc.) without revealing secrets.

3. **Retry Failed Ingestion Jobs** (Medium Risk)
   - **Dry Run**: Required to be false for execution. Defaults to True.
   - **Confirmation**: `retry-jobs`
   - **Behavior**: In Dry Run, it reports the count of failed `DocumentIngestionJob`s. In Real execution, it resets up to 50 failed jobs to `pending`.

4. **Trigger RAG Re-index** (High Risk)
   - **Dry Run**: Required to be false for execution. Defaults to True.
   - **Confirmation**: `reindex-rag`
   - **Behavior**: Currently safely restricted to return `not_implemented` to prevent accidental large-scale re-indexing of chunks.

5. **Clear Safe Cache** (Medium Risk)
   - **Dry Run**: Required to be false for execution. Defaults to True.
   - **Confirmation**: `clear-cache`
   - **Behavior**: Returns `not_configured` currently.

6. **Toggle Maintenance Mode** (High Risk)
   - **Dry Run**: Required to be false for execution. Defaults to True.
   - **Confirmation**: `toggle-maintenance`
   - **Behavior**: Returns `planned` currently, as persistence is not yet implemented.

## Verification Steps

1. **Unknown Action Check**: API rejects unknown actions with a 400 response.
2. **Confirmation Check**: API rejects medium/high risk real executions if the confirmation phrase does not exactly match.
3. **Audit Log Check**:
   - Before execution, an audit log with `action: MAINTENANCE_X` is written.
   - After execution, the `afterValue` is updated with `ok`, `status`, and `message`.
4. **Secrets Check**: Ensure no environment variable values are returned in summary outputs.
5. **Permissions Check**: Action execution validates if the user role has the required permission (`MANAGE_SYSTEM_SETTINGS` or `VIEW_SYSTEM_HEALTH`).
