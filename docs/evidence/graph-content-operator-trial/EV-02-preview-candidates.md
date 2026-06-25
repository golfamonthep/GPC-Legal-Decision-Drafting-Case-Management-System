# Evidence EV-02: Preview Candidates

**Evidence ID:** EV-02
**Test Case:** Preview Candidates
**Date/Time:** PENDING EXECUTION
**Environment:** Staging / Preview
**Operator Role:** PENDING
**Route/UI:** `/api/document-sync/microsoft/content-ingestion/preview`

## Preconditions
- Fake test files exist in the mock graph service.

## Expected Result
- `.txt` and `.md` are flagged as allowed.
- `.pdf`, `.zip`, `.bin`, `.docm` are flagged as blocked.
- No content is actually downloaded.

## Actual Result
- N/A

## Pass/Fail/Blocked
**BLOCKED** (Missing Prompt 70 hardening and release gate approval).
