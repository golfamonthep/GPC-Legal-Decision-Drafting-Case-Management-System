# Microsoft Graph Schema Plan

**Date**: 2026-06-17
**Prompt**: 62

This document defines the additive future schema needed for Microsoft Graph Document Sync. 
**Note**: No migration is executed in this prompt. This is a design plan only.

## Potential Models

### 1. ExternalDocumentSource
Tracks configured external locations (e.g., SharePoint sites, OneDrive folders).
* `id`: String (UUID)
* `provider`: String (e.g., "MICROSOFT_GRAPH")
* `displayName`: String
* `siteId`: String?
* `driveId`: String?
* `folderItemId`: String?
* `enabled`: Boolean (default false)
* `createdAt`: DateTime
* `updatedAt`: DateTime
* `createdById`: String? (relation to User)

### 2. ExternalDocumentItem
Tracks individual document metadata from external sources.
* `id`: String (UUID)
* `sourceId`: String (relation to ExternalDocumentSource)
* `provider`: String
* `driveId`: String?
* `itemId`: String
* `name`: String
* `webUrl`: String?
* `eTag`: String?
* `mimeType`: String?
* `size`: Int?
* `lastModifiedAt`: DateTime?
* `syncStatus`: String (e.g., "PENDING", "SYNCED", "ERROR")
* `caseId`: String? (optional relation to Case)
* `documentId`: String? (optional relation to CaseDocument)
* `lastSyncedAt`: DateTime?
* `createdAt`: DateTime
* `updatedAt`: DateTime

### 3. DocumentSyncRun
Tracks the execution of a bulk/batch document sync job.
* `id`: String (UUID)
* `sourceId`: String? (relation to ExternalDocumentSource)
* `mode`: String (e.g., "MANUAL", "SCHEDULED")
* `dryRun`: Boolean
* `status`: String ("IN_PROGRESS", "COMPLETED", "FAILED")
* `startedAt`: DateTime
* `completedAt`: DateTime?
* `startedById`: String? (relation to User)
* `totalFound`: Int
* `totalLinked`: Int
* `totalSkipped`: Int
* `errorSummary`: String? @db.Text

### 4. DocumentSyncRunItem
Tracks individual items processed within a DocumentSyncRun.
* `id`: String (UUID)
* `runId`: String (relation to DocumentSyncRun)
* `externalItemId`: String
* `status`: String ("SUCCESS", "SKIPPED", "ERROR")
* `reason`: String?
* `linkedDocumentId`: String?
* `createdAt`: DateTime

## Schema Indexes
* `ExternalDocumentItem`: Index on `[sourceId]`, `[itemId]`, `[syncStatus]`
* `DocumentSyncRunItem`: Index on `[runId]`

## Migration Risk
* These models are fully additive.
* They do not modify existing data structures.
* Risk level is very low.
