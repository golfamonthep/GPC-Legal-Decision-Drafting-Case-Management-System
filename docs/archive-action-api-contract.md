# Archive Action API Contract

## Implemented API Endpoint (Preview)
`POST /api/records-retention/archive/preview`

## Implemented API Endpoint (Execute - Staging Only)
`POST /api/records-retention/archive/execute`

## Request Body
```json
{
  "caseIds": ["string"],
  "confirmationPhrase": "string",
  "reason": "string",
  "policyReference": "string (optional)"
}
```
*Note: `confirmationPhrase` must be "ARCHIVE PILOT CASES" or project-specific Thai equivalent. Reason is required.*

## Response Body
```json
{
  "ok": "boolean",
  "executed": "boolean",
  "archiveBatchId": "string (optional)",
  "archivedCount": "number",
  "blockedCount": "number",
  "blockedReasons": {
    "caseId1": "reason",
    "caseId2": "reason"
  },
  "warnings": ["string"]
}
```

## Environment Status Endpoint (Optional UI Check)
`GET /api/records-retention/archive/environment`

## Authorization
- Requires `ARCHIVE_CASE` permission.
- If missing, 403 Forbidden.

## Error Behavior
- **401 Unauthorized**: If unauthenticated. (Mapped from `requireApiPermission`).
- **403 Forbidden**: If unauthorized (lacks role/permission). (Mapped from `requireApiPermission`).
- **423 Locked**: If execution environment gate blocks the request (e.g. production environment detected without explicit override).
- **400 Bad Request**: If request is invalid (missing caseIds, reason, or confirmation phrase) or batch limit exceeded.
- **409 Conflict**: If stale status or ineligible case detected during execution (often handled silently by skipping blocked cases and returning in `blockedReasons`).
- **500 Internal Server Error**: Only for unexpected server errors. Sanitized (no raw database errors).

## Important Implementation Rule
Because `requireApiPermission` throws `"UNAUTHORIZED"` / `"FORBIDDEN"`, the route must call it inside `try/catch` and map thrown values to 401/403.
  
## Execution Readiness  
Archive execution is currently implemented but heavily gated behind `ALLOW_STAGING_ARCHIVE_EXECUTION=YES` and blocks production execution. Reversibility and audit batch support exist. Production readiness requires UAT sign-off and removing the environment gate flag restriction in a future prompt. Production release is NO-GO.
