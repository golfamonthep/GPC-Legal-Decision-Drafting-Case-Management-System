# Microsoft Graph Document Sync Foundation

**Date**: 2026-06-17
**Prompt**: 62

## Current Architecture Review
* **Document Models**: The database schema currently has `CaseDocument` which tracks documents linked to a `Case`. It already contains placeholder fields for OneDrive/SharePoint integration: `storageProvider`, `driveId`, `driveItemId`, `webUrl`, `fileName`, `mimeType`, `fileSize`, `documentCategory`, `sourceStatus`, `uploadedByUserId`, `syncedAt`, `syncStatus`, `syncError`.
* **Auth**: Uses NextAuth with Azure AD. `microsoftAccountId` is linked to `User`.
* **Microsoft Graph Config**: An existing file `src/lib/microsoft/graphConfig.ts` checks for `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, etc.
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

### 4. Out of Scope for Prompt 62 (Foundation)
* Live Microsoft Graph call
* Token storage
* Document content download
* RAG ingestion
* Production sync
* Delete/purge
* Bidirectional writeback
