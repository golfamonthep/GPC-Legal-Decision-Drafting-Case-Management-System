# Archive Retention Schema Implementation Notes

## Prisma generator output path
- Output path: `../src/generated/prisma`
- It is imported via `@/lib/db.ts` or directly from `src/generated/prisma`.

## Datasource configuration
- Provider: `postgresql`
- We use Supabase pooler via `DATABASE_URL` for runtime and `DIRECT_URL` for migrations.

## Current model naming conventions
- Models use PascalCase.
- ID fields use String with cuid/uuid (the schema currently uses `@default(uuid())`).
- Timestamps use `createdAt` and `updatedAt`.
- Relations use descriptive names and explicit fields.
- User references use `...UserId` suffix for relations, e.g. `ownerId`, `archivedByUserId`.

## Current models relevant to Archive
- `Case` model
- `CaseArchiveRecord` model (exists, holds most archive fields)
- `KnowledgeReuseReview` model

## Designed Additions

### 1. `CaseArchiveRecord` updates
Since `CaseArchiveRecord` already exists and holds archive state, we will add the missing fields there rather than cluttering the `Case` model directly, aligning with Prompt 54's decision:
- `previousStatusBeforeArchive` (String?): Needed for safe reversal.
- `archiveBatchId` (String?): Needed for batch auditing.
- `retentionStatus` (String?): To hold explicit retention status.
- `retentionDueAt` (DateTime?): Hard deadline for retention.
- `retentionReviewedAt` (DateTime?)
- `retentionReviewedByUserId` (String?)
- `retentionReviewNotes` (String? @db.Text)
- `legalHoldSetAt` (DateTime?)
- `legalHoldSetByUserId` (String?)

### 2. `ArchiveBatch` (New Model)
- `id` (String @id @default(uuid()))
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)
- `createdByUserId` (String?) -> Relation to `User`
- `dryRun` (Boolean @default(false))
- `status` (String)
- `reason` (String?)
- `policyReference` (String?)
- `confirmationMarker` (String?)
- `totalCount` (Int @default(0))
- `eligibleCount` (Int @default(0))
- `blockedCount` (Int @default(0))
- `executedAt` (DateTime?)
- `notes` (String? @db.Text)
- `items` -> Relation to `ArchiveBatchItem`

### 3. `ArchiveBatchItem` (New Model)
- `id` (String @id @default(uuid()))
- `archiveBatchId` (String) -> Relation to `ArchiveBatch`
- `caseId` (String) -> Relation to `Case`
- `createdAt` (DateTime @default(now()))
- `status` (String)
- `previousCaseStatus` (String?)
- `previousArchiveStatus` (String?)
- `blockedReasons` (String? @db.Text)
- `impactPreview` (String? @db.Text)
- `executedAt` (DateTime?)
- `resultMessage` (String? @db.Text)

### 4. Enums
We will use String fields as enums are not consistently enforced at the Prisma level (the project uses String fields for status). This avoids destructive enum changes and respects the project's current pattern.
