# Records Retention UI Plan

## Phase 1 Findings

Existing Foundation:
- **Models**: `CaseArchiveRecord`, `RetentionPolicy`, `KnowledgeReuseReview` exist in `prisma/schema.prisma`.
- **Enums**: `RecordLifecycleStatus`, `KnowledgeReuseStatus`.
- **Permissions**: `VIEW_RECORDS_ARCHIVE`, `MANAGE_RECORDS_ARCHIVE`, `MARK_CASE_ARCHIVABLE`, `ARCHIVE_CASE`, `UNARCHIVE_CASE`, `VIEW_RETENTION_METADATA`, `MANAGE_RETENTION_POLICY`, `APPROVE_KNOWLEDGE_REUSE`, `INGEST_FINAL_DECISION_TO_KNOWLEDGE`, `EXPORT_ARCHIVE_REPORT`, `EXPORT_RECORD_PACKAGE` are all present in `src/lib/auth/permissions.ts`.
- **API/Routes**: None currently exist.
- **Audit**: `AuditLog` exists and handles general auditing.

## Phase 2 Scope

The Records Retention UI will be built as a read-only interface first to prevent accidental data destruction.

**Required UI Sections**:
1. **Retention Overview**: Total cases reviewed, archive-ready, retained/active.
2. **Retention Queue**: List of cases needing retention review.
3. **Case Retention Detail Panel**: Case metadata summary, workflow status.
4. **Policy Reference Panel**: Explains lifecycle stages and 'no destructive delete' policy.
5. **Safety Banner**: Clearly states the system is in read-only mode and no purge/delete actions are available.

## Phase 3 Permission Model
- Use `VIEW_RECORDS_ARCHIVE` for page access and read APIs.
- Permissions are already defined in the system.

## Phase 4 & 5 Construction
- Create `src/app/records-retention/page.tsx` as a Server Component.
- Server-side permission check using `requirePermission('VIEW_RECORDS_ARCHIVE')`.
- Create `src/lib/records-retention/retentionQueries.ts` to perform Prisma queries without exposing secrets.
- Add "การเก็บรักษาและคลังสำนวน" to `src/components/Sidebar.tsx`.
