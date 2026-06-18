# DATABASE_SCHEMA.md — GPC Legal Decision Drafting & Case Management System

> **Mandatory Read-First Rule**: All future prompts must read this file before touching the database or Prisma schema.
> Never run `prisma migrate deploy` inside Vercel build. Run migrations manually.
> Never document real database credentials, connection strings, or passwords here.

---

## 1. Generator Configuration

```prisma
generator client {
  provider   = "prisma-client-js"
  engineType = "library"
  output     = "../src/generated/prisma"
}
```

**Always import Prisma Client from `src/generated/prisma`, NOT from `@prisma/client`.**

```typescript
// CORRECT
import { PrismaClient } from '../generated/prisma';
// or
import prisma from '@/lib/db';

// WRONG — will fail at runtime
import { PrismaClient } from '@prisma/client';
```

---

## 2. Datasource

```prisma
datasource db {
  provider = "postgresql"
}
```

- Provider: PostgreSQL
- Runtime connection: Supabase transaction-mode pooler (`DATABASE_URL`)
- Migration connection: Supabase session-mode pooler (`DIRECT_URL`) via `prisma.config.ts`
- Requires pgvector extension (enabled in Supabase dashboard)

---

## 3. Database Client Setup

The singleton Prisma client is at [`src/lib/db.ts`](file:///c:/APP/src/lib/db.ts).
It uses `@prisma/adapter-pg` with the `DATABASE_URL` env variable.

Key rules in `db.ts`:
- Production rejects localhost/127.0.0.1/base hosts
- Supports `prisma+postgres://` Accelerate URLs as fallback
- Singleton pattern to avoid connection pool exhaustion in serverless

---

## 4. Migrations

| Migration | Description |
|-----------|-------------|
| `20260608000000_add_pgvector` | Add pgvector extension and `DocumentChunk.embedding vector(1536)` column |
| `20260610081044_relax_registry_import_validation` | Loosen validation constraints for Excel import |
| `20260612140000_add_microsoft_graph_document_fields` | Add OneDrive/SharePoint fields to `CaseDocument` |
| `20260612141800_add_microsoft_auth_fields` | Add `microsoftAccountId` and Microsoft auth fields to `User` |
| `20260612160000_add_assignment_fields` | Add legal officer assignment tracking fields to `Case` |
| `20260612170000_add_meeting_workflow` | Add `Meeting`, `MeetingAgendaItem`, `MeetingAttendee` models |

> **Note**: Records Retention models (`CaseArchiveRecord`, `RetentionPolicy`, `KnowledgeReuseReview`) are in schema but may require a migration to apply if not yet deployed. Verify in Supabase dashboard.

---

## 5. Model List

| Model | Purpose |
|-------|---------|
| `User` | System users with role and status |
| `Case` | Core case entity (grievance or appeal) |
| `CaseDocument` | Documents linked to a case |
| `CaseEvent` | Audit-trail events for a case |
| `DecisionDraft` | Decision draft document for a case |
| `DecisionDraftSection` | Individual section of a draft (facts, issues, reasoning, conclusion) |
| `LegalSource` | Legal knowledge library source document |
| `LegalClause` | Individual clause extracted from a LegalSource |
| `AiQueryLog` | Log of AI Q&A queries and responses |
| `AuditLog` | General audit log for all significant actions |
| `DocumentIngestionJob` | Status tracking for document ingestion/embedding jobs |
| `DocumentChunk` | Chunked text from legal sources, with vector embedding |
| `DocumentChunkCitation` | Links chunks to draft sections that cited them |
| `RetrievalQuery` | Logged retrieval queries |
| `RetrievalResult` | Individual results from a retrieval query |
| `LegalAnswer` | AI-generated legal answer from RAG |
| `LegalAnswerCitation` | Chunks that support a LegalAnswer |
| `DraftSectionAiLog` | Detailed log of AI draft section generation |
| `Meeting` | Committee meeting |
| `MeetingAgendaItem` | Case scheduled for a meeting |
| `MeetingAttendee` | Attendee of a meeting |
| `CaseArchiveRecord` | Archive status and metadata for a case |
| `ArchiveBatch` | Audit trail for batch archive execution actions |
| `ArchiveBatchItem` | Individual case impact record within a batch archive action |
| `RetentionPolicy` | Retention policy definition |
| `KnowledgeReuseReview` | Review of whether a final decision can be added to knowledge base |

---

## 6. Key Model Details

### User
```
id, email (unique), name, role, microsoftAccountId (unique?),
image, status (PENDING/ACTIVE/DISABLED), lastLoginAt, createdAt, updatedAt
```
- `role`: `ADMIN | COMMISSIONER | LEGAL_OFFICER | REGISTRY_OFFICER | VIEWER`
- `status`: `PENDING | ACTIVE | DISABLED`
- Linked to: `Case` (owner, legal officer), `AuditLog`, `AiQueryLog`, `RetrievalQuery`, `DraftSectionAiLog`, `Meeting`

### Case
```
id, type (ร้องทุกข์|อุทธรณ์), blackNumber (unique), redNumber (unique?),
petitionerName, respondentName, subject, legalCategory,
ownerId (→ User), legalOfficerId (→ User), legalOfficerName,
committeeOwnerName, assignedAt, assignmentUpdatedAt,
receivedDate, dueDate30/60/90/120/240,
currentStatus, meetingDate, decisionResult, oneDriveUrl,
proceedingNote (Text), dispatchData (Text),
createdAt, updatedAt
```
- **Pilot Data Note**: Seeded pilot cases must be prefixed with `PILOT-CASE-` in `blackNumber` to ensure they can be safely identified and cleaned up. Real records must not use this prefix.

### DecisionDraft / DecisionDraftSection
- Each Case can have multiple drafts
- Each draft has sections (facts, issues, reasoning, conclusion)
- Sections have `status`: `pending | in_progress | completed`
- Drafts have `status`: `draft | review | approved`

### LegalSource
- Knowledge library entry
- Has `sourceStatus` (ใช้งาน / deprecated), `reliabilityLevel` (official / unofficial)
- Contains `LegalClause` records and `DocumentChunk` records (vectorized)
- Linked to `DocumentIngestionJob` for tracking ingestion status

### DocumentChunk
- Key RAG entity
- Contains: `content`, `normalizedContent`, `embedding vector(1536)`
- Metadata for filtering: `sourceType`, `sourceStatus`, `reliabilityLevel`, `legalCategory`, `issueTags`, `lawNames`, `articleNumbers`, `decisionResult`
- Indexes on: `legalSourceId`, `sourceStatus`, `reliabilityLevel`, `legalCategory`, `issueTags`, `effectiveDate/expiredDate`
- `embeddingStatus`: `pending | completed | failed`

### AuditLog
```
id, userId, action, entityType, entityId, beforeValue (Text), afterValue (Text), timestamp
```

### Meeting / MeetingAgendaItem
- `Meeting.status`: `DRAFT | SCHEDULED | AGENDA_LOCKED | IN_PROGRESS | COMPLETED | CANCELLED`
- `MeetingAgendaItem.readinessStatus`: `PENDING_REVIEW | READY | NEEDS_REVISION`
- `MeetingAgendaItem.boardResult`: `เห็นชอบตามร่าง | ให้แก้ไขร่าง | เลื่อนพิจารณา`

---

## 7. Auth-Related Models

| Model | Purpose |
|-------|---------|
| `User` | Users with role and status; linked to NextAuth session |

Auth is handled via NextAuth JWT — **no separate session table in DB**.
The `User` table is the source of truth for role and status checks.

---

## 8. Case Workflow Models

```
Case (registry entry)
  ├── CaseEvent (timeline audit)
  ├── CaseDocument (linked files)
  ├── DecisionDraft
  │     └── DecisionDraftSection (facts/issues/reasoning/conclusion)
  ├── MeetingAgendaItem (→ Meeting)
  ├── CaseArchiveRecord (archive status) -> ArchiveBatchItem (batch history)
  └── KnowledgeReuseReview (knowledge base eligibility)
```

---

## 9. RAG / Knowledge Library Models

```
LegalSource (library entry)
  ├── LegalClause (extracted clauses)
  ├── DocumentIngestionJob (ingestion status)
  └── DocumentChunk (vectorized text chunks)
        ├── DocumentChunkCitation (link to draft sections)
        ├── RetrievalResult (search results)
        └── LegalAnswerCitation (link to AI answers)

RetrievalQuery → RetrievalResult + LegalAnswer
LegalAnswer → LegalAnswerCitation → DocumentChunk
```

### Cleanup Dependency Notes
Due to Prisma `onDelete: Cascade` on most relation fields, deleting the top-level `Case` will cascade and delete associated `CaseEvent`, `CaseDocument`, `DecisionDraft` and `MeetingAgendaItem`.
To avoid database constraint errors during seed or cleanup, delete in this strict order:
1. `MeetingAgendaItem`
2. `Meeting`
3. `DecisionDraftSection`
4. `DecisionDraft`
5. `CaseEvent`
6. `CaseDocument`
7. `Case`
8. `User`

### Seed Validation Observations (Prompt 50)
- Dry-run confirmed: pilot seed script plans 5 users, 8 cases, 1 draft, 1 meeting = ~15 records.
- Real seed NOT executed: preview/staging DB not confirmed non-production.
- Pilot users are identifiable by `@example.test` email domain and `Pilot ` name prefix.
- Pilot cases are identifiable by `PILOT-CASE-` prefix in `blackNumber`.
- Pilot draft is identifiable by `PILOT_DRAFT_` prefix in `title`.
- Pilot meeting is identifiable by `PILOT-MTG-` prefix in `meetingNo`.
- `AuditLog.action = 'PILOT_SEED_EXECUTED'` is written by the seed script on real execution.
- **Model dependencies for pilot workflow**:
  - Registry/case listing: `Case`, `User`
  - Drafting: `Case`, `DecisionDraft`, `DecisionDraftSection`, `User`
  - Finalization: `Case`, `DecisionDraft`, `AuditLog`
  - Meetings: `Meeting`, `MeetingAgendaItem`, `Case`
  - Assignments: `Case`, `User` (legalOfficerId)
  - Data quality: `Case` (missing fields detection)
  - RAG/Library: `LegalSource`, `DocumentChunk`, `LegalAnswer` (no pilot records seeded yet)

### Staging Migration Readiness (Prompt 50B)
- 6 migrations exist in `prisma/migrations/` — all must be applied to staging DB before pilot seed.
- Staging DB must have `CREATE EXTENSION vector` applied before migrations (required for `DocumentChunk.embedding` column).
- Migration command for staging: `DIRECT_URL=<staging-direct-url> npm run db:migrate:deploy` (never commit the URL).
- Schema parity required: staging DB schema must match production schema exactly.
- Schema drift risk: Low — only 6 well-documented migrations applied.
- Prisma client import path (`src/generated/prisma`) and adapter config (`@prisma/adapter-pg`) remain the same for staging.
- Seed script dependency: All models used by seed (`User`, `Case`, `DecisionDraft`, `DecisionDraftSection`, `Meeting`, `AuditLog`) must exist in staging schema.

### Migration Policy (Prompt 50D)
- Local development may use `prisma db push` **only** with a disposable local DB if explicitly allowed.
- Staging and production **must** use `prisma migrate deploy`.
- **Never** use `prisma db push --accept-data-loss` outside of a disposable local DB environment.
- **Never** run migrations automatically during the Vercel build process. All staging/production migrations must be run manually via `DIRECT_URL`.

---

## 10. Records Retention & Archiving

**Overview**: Manages the retention lifecycle and formal archiving of case records.
**Key Tables**:
- `CaseArchiveRecord` (Tracks archive status, reasoning, box numbers, and unarchiving actions)
- `ArchiveBatch` and `ArchiveBatchItem` (Tracks batch archive execution actions, eligibility, and impact)
- `RetentionPolicy` (Defines timeframes and rules for retention)
- `KnowledgeReuseReview` (Controls ingestion of case data into search/RAG)

**Schema Gaps (Prompt 54 Analysis / Prompt 55 Fixes)**: 
- **Missing Fields**: `CaseArchiveRecord` lacked `retentionDueAt`, `previousStatusBeforeArchive` (required for safe reversal), and `archiveBatchId` (required for auditing). **Fixed in Prompt 55.**
- **Missing Models**: No dedicated `ArchiveBatch` model existed. **Fixed in Prompt 55.**
- **Eligibility**: Evaluation lacks detailed schema support for evaluating document completion and granular data quality issues, leading to conservative fallback checks (`SCHEMA_SUPPORT_MISSING`).
- **Migration Status**: No migration generated in Prompt 55 because local dev DB was unavailable. A manual migration plan (`docs/archive-retention-migration-manual-plan.md`) must be executed before archive execution.
- **Execution Endpoint (Prompt 57)**: The `POST /api/records-retention/archive/execute` endpoint was added. It inserts records into `ArchiveBatch` and `ArchiveBatchItem`, updates `CaseArchiveRecord` (including `previousStatusBeforeArchive` and `archiveBatchId`), and creates an `AuditLog`. Execution remains strictly limited to staging via environment gates.
- **Execution UI (Prompt 58)**: `ArchivePreviewPanel.tsx` now supports the full state machine from dry-run preview to execution, requiring an exact confirmation phrase. It surfaces the `ArchiveBatch.id` (`archiveBatchId`) on success for clear auditability. Production execution remains blocked.
- **Execution UAT & Reversal Verification (Prompt 59)**: Schema was verified capable of safely preserving previous state (`previousStatusBeforeArchive`, `ArchiveBatchItem.previousCaseStatus`) and maintaining `archiveBatchId` linkage for auditing. Reversal is conceptually ready with no data loss, but explicit implementation is deferred to a future prompt.
- **Production Archive Release Gate (Prompt 60)**: Archive schema may exist, but production use is blocked until runtime UAT and reversal verification are complete. Release decision is currently NO-GO.
- **Staging Archive Migration Readiness (Prompt 61A/61B)**: Pilot archive records rely on archive/retention schema changes. No production migration in this prompt. Migration remains blocked awaiting explicit staging environment target confirmation by the owner.

## 11. External Document Sync (Microsoft Graph)

**Overview**: Future additive schema designed to track external document sources and metadata without modifying existing core tables.

**Proposed Models (Not Migrated Yet)**:
- `ExternalDocumentSource`: Tracks configured external locations (e.g., SharePoint sites).
- `ExternalDocumentItem`: Tracks individual document metadata (eTag, webUrl, mimeType).
- `DocumentSyncRun`: Tracks execution of a batch sync job.
- `DocumentSyncRunItem`: Tracks individual items processed within a `DocumentSyncRun`.

**Design Notes**:
- Completely additive models with low migration risk.
- Currently, no migration has been executed. Implementation remains in the planning phase.
- **Prompt 63 Update**: No schema changes occurred. Graph sync data persistence remains intentionally disabled. Future schema migration remains separate.
- **Prompt 64 Update**: No schema changes occurred. Graph metadata persistence is intentionally excluded from the metadata dry run. Future persistence models remain planned but blocked until live sync is fully approved.


---

## 11. Enums Defined in Schema

```prisma
enum RecordLifecycleStatus {
  ACTIVE, FINALIZED, DISPATCHED, COURT_FOLLOWUP,
  READY_TO_ARCHIVE, ARCHIVED, RETENTION_REVIEW_REQUIRED, HOLD, REOPENED
}

enum KnowledgeReuseStatus {
  NOT_REVIEWED, NOT_ELIGIBLE, PENDING_REVIEW,
  APPROVED_FOR_INTERNAL_SEARCH, APPROVED_FOR_RAG,
  INGESTED_TO_RAG, REVOKED, NEEDS_REDACTION, HOLD
}
```

> Note: These enums are defined in schema but the corresponding string fields in models
> (`lifecycleStatus`, `knowledgeReuseStatus`) use plain `String` type, not the enum.
> Enum values are enforced at the application layer.

---

## 11. Migration Rules

1. **Never run `prisma migrate deploy` inside Vercel build command.**
2. Run migrations manually from a machine with `DIRECT_URL` access:
   ```bash
   npx prisma migrate deploy
   ```
3. Always create a new migration for schema changes:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
4. After schema changes, regenerate the client:
   ```bash
   npx prisma generate
   ```
5. Never document real credentials here or in any tracked file.
6. Verify migration applied in Supabase dashboard before running seed or app.

---

## 12. pgvector Notes

- Extension must be enabled in Supabase: `CREATE EXTENSION vector;`
- The `embedding` column uses `Unsupported("vector(1536)")` in Prisma schema.
- Raw SQL queries are used for vector similarity search.
- Embedding model: `text-embedding-3-small` (1536 dimensions).
- Index type: default (not HNSW yet); monitor performance at scale.

---

*Last updated: Prompt 50B (2026-06-17)*
*Update this file whenever schema changes, new migrations are added, or Prisma model descriptions change.*
  
## Prompt 65 Updates  
* Microsoft Graph metadata persistence models added (ExternalDocumentSource, ExternalDocumentItem, DocumentSyncRun, DocumentSyncRunItem).  
* Migration status: Generated locally, blocked for staging.  
* No document content stored.  
* No token storage.  
* Future Document/RAG linkage deferred. 
* sync run/report models verified or pending: Pending migration to staging.
* no document content stored.
* no token storage.
* no official Document/RAG linkage.
