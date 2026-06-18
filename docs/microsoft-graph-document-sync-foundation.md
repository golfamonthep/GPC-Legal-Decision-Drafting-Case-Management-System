# Microsoft Graph Document Sync Foundation

**Date**: 2026-06-18
**Prompt**: 63

## Current Architecture Review
* **Document Models**: The database schema currently has `CaseDocument` which tracks documents linked to a `Case`. It already contains placeholder fields for OneDrive/SharePoint integration: `storageProvider`, `driveId`, `driveItemId`, `webUrl`, `fileName`, `mimeType`, `fileSize`, `documentCategory`, `sourceStatus`, `uploadedByUserId`, `syncedAt`, `syncStatus`, `syncError`.
* **Auth**: Uses NextAuth with Azure AD. `microsoftAccountId` is linked to `User`.
* **Microsoft Graph Config**: Setup allows checking for `MICROSOFT_GRAPH_TENANT_ID`, `MICROSOFT_GRAPH_CLIENT_ID`, `MICROSOFT_GRAPH_CLIENT_SECRET`, etc.
* **Permission Model**: Existing RBAC via NextAuth JWT and `src/lib/auth/permissions.ts`. A `VIEW_INTEGRATION_STATUS` permission exists.

## Future Sync Scope

### 1. Supported Source Types
* SharePoint document library
* OneDrive folder
* Microsoft Teams-backed SharePoint folder if applicable

### 2. Future Document Metadata
* `externalProvider`
* `externalDriveId`
* `externalItemId`
* `externalWebUrl`
* `externalETag`
* `externalLastModifiedAt`
* `externalCreatedAt`
* `externalFileName`
* `externalMimeType`
* `externalSize`
* `syncStatus`
* `lastSyncedAt`
* `syncErrorCode`
* `caseId` (if linked to case)
* `documentCategory` (if available)

### 3. Sync Modes
* Manual selected-folder sync
* Metadata-only sync
* Future content ingestion
* Future RAG indexing
* Future delta sync

### 4. Out of Scope for Prompt 63 (Live Connectivity Test)
* Live Microsoft Graph call (Blocked by Owner Confirmation Gate)
* Token storage
* Document content download
* DB mutation
* RAG ingestion
* Production sync
* Delete/purge
* Bidirectional writeback
