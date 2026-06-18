# Microsoft Graph Metadata Persistence Schema Design

**Date**: 2026-06-18
**Prompt**: 65

This document outlines the additive schema required for storing Microsoft Graph sync run records and sanitized metadata dry-run records safely.

## Principles
1. **Additive Only**: No destructive changes to existing tables.
2. **Sanitization**: Store stable hashes or redacted keys instead of raw Graph IDs where possible to minimize leakage of external tenant structure.
3. **No Content**: Do not store file blobs or document text.
4. **No Secrets**: Do not store OAuth tokens or client secrets.
5. **No Production Mutation**: Only apply to staging environments with owner confirmation.

## Proposed Models

### 1. ExternalProvider (Enum)
```prisma
enum ExternalProvider {
  MICROSOFT_GRAPH
}
```

### 2. ExternalSourceType (Enum)
```prisma
enum ExternalSourceType {
  SHAREPOINT_SITE
  ONEDRIVE_FOLDER
}
```

### 3. ExternalDocumentSyncStatus (Enum)
```prisma
enum ExternalDocumentSyncStatus {
  PENDING
  SYNCED
  FAILED
  IGNORED
}
```

### 4. DocumentSyncRunStatus (Enum)
```prisma
enum DocumentSyncRunStatus {
  STARTED
  COMPLETED
  FAILED
  PARTIAL
}
```

### 5. DocumentSyncRunMode (Enum)
```prisma
enum DocumentSyncRunMode {
  MANUAL
  SCHEDULED
}
```

### 6. ExternalDocumentSource
Stores configured external source references (like a specific SharePoint Site/Drive).
```prisma
model ExternalDocumentSource {
  id               String   @id @default(uuid())
  provider         ExternalProvider
  sourceType       ExternalSourceType
  displayName      String?
  safeDescription  String?
  
  // Stored as hashes to prevent exposing raw IDs unnecessarily
  siteIdHash       String?
  driveIdHash      String?
  folderItemIdHash String?
  rawIdsStored     Boolean  @default(false)
  
  enabled          Boolean  @default(true)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  createdById      String?  // References User.id but loosely or strictly depending on needs
  lastCheckedAt    DateTime?

  items            ExternalDocumentItem[]
  syncRuns         DocumentSyncRun[]
}
```

### 7. ExternalDocumentItem
Stores sanitized metadata record for an external item.
```prisma
model ExternalDocumentItem {
  id                  String   @id @default(uuid())
  sourceId            String
  source              ExternalDocumentSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  provider            ExternalProvider
  sourceType          ExternalSourceType
  
  externalItemKeyHash String   // A hash of the Graph itemId to allow stable delta queries without exposing the ID
  externalETagHash    String?
  
  safeDisplayName     String
  itemKind            String?  // e.g., 'file' or 'folder'
  extension           String?
  mimeType            String?
  sizeBytes           BigInt?
  
  createdAtExternal   DateTime?
  lastModifiedAtExternal DateTime?
  
  hasWebUrl           Boolean  @default(false)
  webUrlStored        Boolean  @default(false)
  
  syncStatus          ExternalDocumentSyncStatus @default(PENDING)
  lastSeenAt          DateTime @default(now())
  lastSyncedAt        DateTime?
  
  // Links to future official records
  linkedDocumentId    String?
  linkedCaseId        String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([provider])
  @@index([sourceId])
  @@index([externalItemKeyHash])
  @@index([syncStatus])
  @@index([lastSeenAt])
}
```

### 8. DocumentSyncRun
Stores summary of a sync run.
```prisma
model DocumentSyncRun {
  id                 String   @id @default(uuid())
  sourceId           String?
  source             ExternalDocumentSource? @relation(fields: [sourceId], references: [id], onDelete: SetNull)
  
  provider           ExternalProvider
  mode               DocumentSyncRunMode @default(MANUAL)
  
  dryRun             Boolean  @default(true)
  metadataOnly       Boolean  @default(true)
  contentDownloaded  Boolean  @default(false)
  dbMutated          Boolean  @default(false)
  ragIndexed         Boolean  @default(false)
  
  status             DocumentSyncRunStatus @default(STARTED)
  
  startedAt          DateTime @default(now())
  completedAt        DateTime?
  startedById        String?
  
  totalSeen          Int      @default(0)
  wouldSyncCount     Int      @default(0)
  wouldSkipCount     Int      @default(0)
  persistedItemCount Int      @default(0)
  warningCount       Int      @default(0)
  
  errorCode          String?
  errorSummary       String?

  items              DocumentSyncRunItem[]

  @@index([provider])
  @@index([status])
}
```

### 9. DocumentSyncRunItem
Stores per-item sync run result.
```prisma
model DocumentSyncRunItem {
  id                  String   @id @default(uuid())
  runId               String
  run                 DocumentSyncRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  externalItemKeyHash String
  safeDisplayName     String
  itemKind            String?
  extension           String?
  mimeType            String?
  sizeBytes           BigInt?
  
  status              ExternalDocumentSyncStatus @default(PENDING)
  wouldSync           Boolean  @default(false)
  wouldSkip           Boolean  @default(false)
  skipReasons         String?  // JSON or comma-separated
  
  contentDownloaded   Boolean  @default(false)
  documentCreated     Boolean  @default(false)
  ragIndexed          Boolean  @default(false)
  
  createdAt           DateTime @default(now())

  @@index([runId])
  @@index([externalItemKeyHash])
}
```
