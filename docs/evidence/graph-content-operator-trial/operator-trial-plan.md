# Microsoft Graph Content Ingestion Operator Trial Plan

## A. Access and Environment
1. Login to staging environment.
2. Confirm staging banner is visible.
3. Confirm production disabled state.
4. Confirm no real documents exist in the test folder.

## B. Preview
1. Run content ingestion preview.
2. Confirm `.txt` and `.md` are allowed.
3. Confirm unsupported files (`.pdf`, `.zip`, `.bin`, `.docm`) are blocked/quarantined if present in the mock folder.
4. Confirm no content is downloaded during the preview.

## C. Execute Prototype
1. Enter reason for execution.
2. Select classification (`PUBLIC_TEST` or `INTERNAL_TEST`).
3. Enter confirmation phrase (`STAGING_CONTENT_TEST_ONLY`).
4. Execute prototype.
5. Confirm only `.txt` and `.md` files are downloaded.
6. Confirm preview is limited.
7. Confirm unsupported files are not downloaded.
8. Confirm quarantine records are created for blocked files.

## D. Quarantine Review
1. Open quarantine list panel.
2. Verify blocked reasons for files.
3. Mark reviewed/reject/escalate if review action exists and is staging-gated.
4. Confirm no Microsoft 365 file was modified.
5. Confirm no delete/purge actions occur.

## E. Negative Tests
1. Missing execution reason.
2. Wrong confirmation phrase.
3. Unsupported file download attempt.
4. Unauthorized user execution attempt.
5. Execution attempt in Production route.

## F. Safety Checks
1. No official Document records created.
2. No RAG/vector records created.
3. No Microsoft 365 writeback.
4. No raw IDs/secrets/full content shown in UI or logs.
5. No production database mutation.
