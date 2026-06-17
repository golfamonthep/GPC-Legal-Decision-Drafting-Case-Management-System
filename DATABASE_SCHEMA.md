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
  ├── CaseArchiveRecord (archive status)
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

---

## 10. Enums Defined in Schema

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

*Last updated: Prompt 47.5 (2026-06-17)*
*Update this file whenever schema changes, new migrations are added, or Prisma model descriptions change.*
