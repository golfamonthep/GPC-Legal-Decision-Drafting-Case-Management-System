# Microsoft Graph Metadata Normalization Contract

**Date**: 2026-06-18
**Prompt**: 64

This contract defines the safe, normalized metadata shape for Microsoft Graph document items. This ensures that raw Graph API responses, secrets, and raw identifiers are not exposed to the client or logged inappropriately.

## Safe Normalized Metadata Shape

**Allowed fields:**
* `provider`: "microsoft-graph"
* `sourceType`: "sharepoint" | "onedrive"
* `safeDisplayName`: string
* `itemKind`: "file" | "folder" | "unknown"
* `mimeType` (if available): string
* `sizeBytes` (if available): number
* `lastModifiedAt` (if available): string (ISO date)
* `createdAt` (if available): string (ISO date)
* `hasWebUrl`: boolean
* `extension`: string
* `safeExternalKeyPreview`: string (redacted/hashed/shortened value only)
* `wouldSync`: boolean
* `wouldSkip`: boolean
* `skipReasons`: string[]
* `wouldRequireContentDownload`: false (hardcoded for this phase)
* `wouldCreateDocumentRecord`: false (hardcoded for this phase)
* `wouldIndexRag`: false (hardcoded for this phase)

## Forbidden Fields in Response/UI/Docs

The following data must **never** be included in the normalized output, API responses, UI components, or logs:
* access token
* refresh token
* client secret
* raw tenant ID
* raw client ID
* raw site ID
* raw drive ID
* raw folder item ID
* raw item ID (if considered sensitive)
* raw web URL (if sensitive)
* file content
* raw Graph API response
* confidential metadata beyond safe test names

## Skip Reason Examples

When classifying an item, the following skip reasons may be assigned:
* `FOLDER_SKIPPED`: Item is a folder, not a file.
* `UNSUPPORTED_FILE_TYPE`: Extension is not in the allowed list.
* `MISSING_NAME`: Item lacks a display name.
* `TOO_LARGE_FOR_FUTURE_INGESTION`: File size exceeds the allowed threshold.
* `CONTENT_DOWNLOAD_NOT_ALLOWED`: Download of content is blocked in the current phase.
* `REAL_DATA_NOT_ALLOWED`: Safety block against processing real data.
* `LIVE_SYNC_DISABLED`: Global live sync flag is disabled.
* `PRODUCTION_BLOCKED`: Environment is production, which is currently blocked from sync.
