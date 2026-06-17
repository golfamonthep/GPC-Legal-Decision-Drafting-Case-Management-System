# Microsoft Graph Sync UAT Checklist

**Date**: 2026-06-17
**Prompt**: 62

This checklist outlines the criteria to verify the safety and read-only nature of the Microsoft Graph Document Sync foundation.

## Acceptance Criteria

- [ ] Unauthenticated users are blocked from `/document-sync` and API endpoints.
- [ ] Unauthorized users (e.g., LEGAL_OFFICER initially, or users without VIEW_DOCUMENT_SYNC) are blocked from accessing the page and APIs.
- [ ] Authorized viewers see the sync status page successfully.
- [ ] The Mock Preview endpoint (`/api/document-sync/microsoft/preview`) returns fake metadata and explicitly states `dryRun: true` and `liveGraphCall: false`.
- [ ] The Status endpoint (`/api/document-sync/microsoft/status`) exposes no secrets (no client secrets, tokens, etc. in response).
- [ ] The Preview endpoint performs no live Microsoft Graph call.
- [ ] No database mutation occurs during the execution of either endpoint or page render.
- [ ] No real document content is uploaded or downloaded.
- [ ] No delete/purge functionality exists in the UI or APIs.
- [ ] The project build passes successfully (`npm run build`).
