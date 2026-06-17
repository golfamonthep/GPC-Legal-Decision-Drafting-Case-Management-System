# Archive Action API Contract

## Implemented API Endpoint (Preview Only)
`POST /api/records-retention/archive/preview`

## Future Execution Endpoint
`POST /api/records-retention/archive`

## Request Body
```json
{
  "caseIds": ["string"],
  "dryRun": "boolean",
  "confirmationPhrase": "string",
  "reason": "string",
  "policyReference": "string (optional)",
  "expectedCurrentStatuses": ["string"]
}
```

## Response Body
```json
{
  "ok": "boolean",
  "dryRun": "boolean",
  "eligibleCount": "number",
  "blockedCount": "number",
  "blockedReasons": {
    "caseId1": "reason",
    "caseId2": "reason"
  },
  "impactPreview": {
    "willBeArchived": ["caseId"],
    "auditWrites": "number"
  },
  "auditId": "string (optional, if executed)",
  "executedAt": "string (optional, if executed)",
  "executedBy": "string (optional, if executed)"
}
```

## Authorization
- Requires `MANAGE_RECORDS_ARCHIVE` permission.
- If missing, documented as a permission gap (ideally should be `MANAGE_RECORDS_RETENTION` but `MANAGE_RECORDS_ARCHIVE` is the safest existing admin/archive permission).

## Error Behavior
- **401 Unauthorized**: If unauthenticated. (Mapped from `requireApiPermission` throwing `"UNAUTHORIZED"`).
- **403 Forbidden**: If unauthorized (lacks role/permission). (Mapped from `requireApiPermission` throwing `"FORBIDDEN"`).
- **400 Bad Request**: If request is invalid (missing caseIds, reason, or confirmation phrase if not dry-run).
- **409 Conflict**: If stale status or ineligible case detected during execution.
- **500 Internal Server Error**: Only for unexpected server errors. Sanitized (no raw database errors).

## Important Implementation Rule
Because `requireApiPermission` throws `"UNAUTHORIZED"` / `"FORBIDDEN"`, the route must call it inside `try/catch` and map thrown values to 401/403.
  
## Execution Readiness  
Archive execution is currently **NOT READY** and unimplemented. Do not implement the POST /api/records-retention/archive endpoint until schema reversibility and permission granularity gaps are resolved. 
