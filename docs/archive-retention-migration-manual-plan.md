# Archive Retention Manual Migration Plan

## Context
The database migration file was not automatically generated because the local Prisma development database was unreachable (Error P1001), and modifying the staging or production database directly using `db push` or undocumented connections is strictly prohibited by project policies.

## Exact Schema Changes Added
The `prisma/schema.prisma` file was modified with additive, backward-compatible fields to support future archive execution.

### `CaseArchiveRecord` Additions
```prisma
  // Added for Prompt 55: Retention and Batching
  previousStatusBeforeArchive String?
  archiveBatchId              String?
  archiveBatch                ArchiveBatch? @relation(fields: [archiveBatchId], references: [id])
  retentionStatus             String?
  retentionDueAt              DateTime?
  retentionReviewedAt         DateTime?
  retentionReviewedByUserId   String?
  retentionReviewNotes        String?       @db.Text
  legalHoldSetAt              DateTime?
  legalHoldSetByUserId        String?

  @@index([archiveStatus])
  @@index([retentionStatus])
  @@index([retentionDueAt])
  @@index([legalHold])
  @@index([archivedAt])
  @@index([archiveBatchId])
```

### `ArchiveBatch` (New Model)
```prisma
model ArchiveBatch {
  id                 String             @id @default(uuid())
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  createdByUserId    String?
  createdByUser      User?              @relation("ArchiveBatchCreator", fields: [createdByUserId], references: [id])
  dryRun             Boolean            @default(false)
  status             String             // "DRAFT", "DRY_RUN", "READY", "EXECUTED", "PARTIAL", "FAILED", "CANCELLED"
  reason             String?
  policyReference    String?
  confirmationMarker String?            // Hash or marker, not raw confirmation text
  totalCount         Int                @default(0)
  eligibleCount      Int                @default(0)
  blockedCount       Int                @default(0)
  executedAt         DateTime?
  notes              String?            @db.Text

  items              ArchiveBatchItem[]
  archiveRecords     CaseArchiveRecord[]
}
```

### `ArchiveBatchItem` (New Model)
```prisma
model ArchiveBatchItem {
  id                    String       @id @default(uuid())
  archiveBatchId        String
  archiveBatch          ArchiveBatch @relation(fields: [archiveBatchId], references: [id], onDelete: Cascade)
  caseId                String
  case                  Case         @relation(fields: [caseId], references: [id], onDelete: Cascade)
  createdAt             DateTime     @default(now())
  status                String       // "ELIGIBLE", "BLOCKED", "EXECUTED", "FAILED", "SKIPPED"
  previousCaseStatus    String?
  previousArchiveStatus String?
  blockedReasons        String?      @db.Text // serialized JSON or text
  impactPreview         String?      @db.Text // serialized JSON or text
  executedAt            DateTime?
  resultMessage         String?      @db.Text

  @@index([archiveBatchId])
}
```

### `User` and `Case` Updates
Added the inverse relations to allow Prisma schema compilation:
- `User`: `archiveBatchesCreated ArchiveBatch[]   @relation("ArchiveBatchCreator")`
- `Case`: `archiveBatchItems    ArchiveBatchItem[]`

## Future Migration Procedure

1. **Local Developer Workstation (Disposable Dev DB)**
   - Start a local Postgres container or dummy database.
   - Run `npx prisma migrate dev --create-only --name add_archive_retention_lifecycle`
   - Inspect the generated SQL. Confirm it contains only `CREATE TABLE`, `ALTER TABLE ADD COLUMN`, and `CREATE INDEX` commands. There must be no `DROP` or `DELETE` commands.
   - Commit the generated migration folder to the repository.

2. **Staging Environment**
   - Wait until `DATABASE_URL` and `DIRECT_URL` point to the confirmed Staging Supabase DB.
   - Execute `DIRECT_URL=<staging-db-url> npm run db:migrate:deploy` manually.
   - Never run `prisma migrate deploy` during the Vercel build.

3. **Production Environment**
   - Do not migrate until staging passes UAT.
   - Follow standard operations runbook for deployment and DB migrations.
