# Evidence EV-05: Permission Negative Tests

**Evidence ID:** EV-05
**Test Case:** Negative Tests
**Date/Time:** PENDING EXECUTION
**Environment:** Staging / Preview
**Operator Role:** PENDING
**Route/UI:** `/api/document-sync/microsoft/content-ingestion/prototype`

## Preconditions
- Prototype endpoints exist.

## Expected Result
- Missing reason -> 400 error.
- Wrong confirmation phrase -> 400 error.
- Attempting to download unsupported files -> blocked/quarantined.
- Unauthorized user -> 403 Forbidden.

## Actual Result
- N/A

## Pass/Fail/Blocked
**BLOCKED** (Missing Prompt 70 hardening and release gate approval).
