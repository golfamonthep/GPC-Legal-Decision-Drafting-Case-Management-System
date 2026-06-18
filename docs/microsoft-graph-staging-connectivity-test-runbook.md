# Microsoft Graph Staging Connectivity Test Runbook

**Date**: 2026-06-18
**Prompt**: 63

This runbook outlines the manual execution and validation steps required to safely perform the staging-only Microsoft Graph live connectivity test, once the owner confirmation gate has been passed.

## Preconditions
- Owner has confirmed the environment is a staging/preview environment (non-production).
- Azure App Registration for Microsoft Graph is configured correctly.
- Test SharePoint/OneDrive folder exists and contains ONLY fake test documents.
- Vercel Preview/Staging environment variables are set:
  - `MICROSOFT_GRAPH_TENANT_ID`
  - `MICROSOFT_GRAPH_CLIENT_ID`
  - `MICROSOFT_GRAPH_CLIENT_SECRET`
  - `MICROSOFT_GRAPH_TEST_FOLDER_ITEM_ID`
  - `ALLOW_MICROSOFT_GRAPH_LIVE_TEST=YES`
- Authorized test user account has the `MANAGE_DOCUMENT_SYNC` permission.

## Execution Steps

1. Log in to the preview/staging deployment using the authorized test account.
2. Navigate to `/document-sync`.
3. Verify the Status panel displays "ตั้งค่าแล้ว" (Configured) and "เปิดใช้งาน" (Enabled) under "Live Test Enabled".
4. Ensure the warning panel correctly identifies the environment as staging.
5. Click the "ทดสอบการเชื่อมต่อ Microsoft Graph" (Test Microsoft Graph Connectivity) button.
6. A POST request will be sent to `/api/document-sync/microsoft/connectivity-test`.

## Validation

Confirm the following safe behaviors upon test execution:
- **Auth Succeeded**: The application successfully acquired a token from Microsoft Graph without exposing the token in the UI or logs.
- **Metadata List Succeeded**: The application successfully retrieved a list of files from the test folder without downloading content.
- **No Document Content Downloaded**: Verify no file contents were requested or returned in the payload.
- **No DB Mutation**: Verify no records were inserted, updated, or deleted in the application database.
- **Sanitized Response**: Check the network tab in the browser to ensure the response payload does NOT contain client secrets, tenant IDs, raw site IDs, raw drive IDs, access tokens, or stack traces.

## Expected Results

The UI should display sanitized file metadata (name, size, sync status) without exposing internal graph identifiers or sensitive token information.

## Failure Cases

- **401 Unauthorized / 403 Forbidden**: Verify the user account has `MANAGE_DOCUMENT_SYNC`. Check session validity.
- **423 Locked (Live Test Disabled)**: Ensure `ALLOW_MICROSOFT_GRAPH_LIVE_TEST=YES` is set in the environment, and it is not a production environment.
- **502 Bad Gateway (Graph Failed)**: Graph API request failed. Verify App Registration credentials, permissions, and folder IDs.
- **500 Internal Server Error**: Unexpected application error. Check server logs (excluding secrets).

## Stop Conditions

Immediately stop the test and revoke Graph credentials if:
- Real case records are found in the test folder.
- Raw tokens or secrets are exposed in browser logs, network payloads, or UI.
- Any unexpected database mutations occur.
