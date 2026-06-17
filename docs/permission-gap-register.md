# Permission Gap Register

## Known Gaps

1. **Upload Document Permission Gap**
   - File: `src/app/api/cases/[id]/documents/upload-placeholder/route.ts`
   - Description: The `UPLOAD_DOCUMENTS` permission is missing from the server-side checks.
   - Status: Deferred (Medium Priority)

2. **RAG Page Auth**
   - Files: `/rag/retrieval-test`, `/legal-qa`
   - Description: Partially hardened in Prompt 46, requires full authorization guard implementation.
   - Status: Deferred (Medium Priority)

3. **Records Retention Full Lifecycle Gaps**
   - Missing fields: `CaseArchiveRecord` model lacks precise destruction due date field (only `retentionReviewDate` is present).
   - Missing model: No direct `ArchiveActionAuditLog` model (though general `AuditLog` can suffice, explicit fields might be missing for compliance).
   - Missing feature: There's no UI for actual deletion/destruction. The current implementation is strictly read-only by design.
   - Status: Acknowledged. No destructive actions will be implemented without further schema updates and rigorous auditing mechanisms.
