# Microsoft Graph Manual Staging Metadata Dry-Run Runbook

**Date**: 2026-06-18
**Prompt**: 64

This runbook outlines the manual execution and validation steps required to safely perform the staging-only Microsoft Graph metadata dry run, once the owner confirmation gates for Prompt 63 and 64 have been passed and the feature is implemented.

## Preconditions
- Prompt 63 connectivity passed.
- Staging environment confirmed.
- Test folder contains fake docs only.
- Authorized user has `PREVIEW_DOCUMENT_SYNC` or `MANAGE_DOCUMENT_SYNC`.
- Production Graph sync disabled.

## Steps
1. Open the preview/staging application and navigate to `/document-sync`.
2. Confirm the status panel indicates that the staging live test is enabled.
3. Click the "Metadata-only dry run" (ทดลองอ่าน Metadata) button.
4. Verify the metadata list is displayed.
5. Confirm no document content download occurs (check network payloads and server logs).
6. Confirm no DB mutation occurs (verify DB state before and after).
7. Confirm no RAG ingestion occurs.

## Evidence Checklist
- [ ] Screenshot of the Metadata-only dry run UI showing the summary and sanitized items.
- [ ] Network tab screenshot verifying only sanitized metadata is returned and no raw secrets or tokens are exposed.
- [ ] Server log excerpt demonstrating successful Graph call and normalized mapping.
- [ ] Database verification confirming no new records in `CaseDocument` or `DocumentChunk`.

## Failure Cases
- **401/403**: Verify the user account has `PREVIEW_DOCUMENT_SYNC` or `MANAGE_DOCUMENT_SYNC`.
- **423 Locked (Live test disabled)**: Ensure `ALLOW_MICROSOFT_GRAPH_LIVE_TEST=YES` is set and the environment is not production.
- **502 Bad Gateway (Graph metadata failed)**: Graph API request failed. Check credentials, permissions, and test folder ID.
- **500 Internal Server Error**: Unexpected application error. Check server logs safely.

## Stop Conditions
Immediately stop the test and revoke Graph credentials if:
- Real/confidential docs appear in the results.
- Raw IDs/secrets appear in the UI, network payloads, or logs.
- Document content is downloaded.
- Database mutation occurs.
- Production environment is detected.
