# Permission Gap Register

| Gap ID | Route / API | Role / Context | Expected Behavior | Actual Behavior | Severity | Recommended Fix | Fixed Now? |
|--------|-------------|----------------|-------------------|-----------------|----------|-----------------|------------|
| GAP-001 | `/api/rag/qa`, `/api/rag/retrieval` | Any authenticated user | Only roles with AI/Drafting permissions (e.g., `USE_AI_DRAFT` or `USE_AI_REVIEW`) can access | NextAuth middleware requires authentication, but no granular permission check is performed | B (High) - Unrestricted token usage by any internal user | Add `requireApiPermission('USE_AI_REVIEW')` | Yes (Added requireApiPermission) |
| GAP-002 | `/library`, `/rag/retrieval-test`, `/legal-qa` | Any authenticated user | Only roles with knowledge archive permissions can access | Accessible to any authenticated user | C (Medium) | Add `requirePermission('VIEW_RECORDS_ARCHIVE')` to server pages / middleware | Partially Yes (Fixed `/library`) |
| GAP-003 | `/api/cases/[id]/documents/upload-placeholder` | Any authenticated user | Only roles with `UPLOAD_DOCUMENTS` can access | Missing granular permission check (currently returns 501 safely) | C (Medium) | Add `hasPermission(user.role, 'UPLOAD_DOCUMENTS')` check | No (Deferred) |
| GAP-004 | `/api/cases/[id]/finalization/*` (except `red-number` and `finalize`) | Authenticated users | Strict mutation boundaries for finalization steps | All finalization routes verified to use `hasPermission` with correct permissions (`MANAGE_POST_MEETING_FOLLOWUP`, `MARK_DRAFT_REVISED`, `CLOSE_CASE_AFTER_DECISION`) | C (Medium) | Verified — all finalization APIs already enforce correct permissions | Yes (Verified, no change needed) |

**Notes:**
* All routes are currently protected against unauthenticated access via `src/middleware.ts` (`withAuth`). There are no Severity A (unauthenticated access) gaps found.
* The deferred items are scheduled for a future prompt focused specifically on hardening the RAG, Library, and Finalization mutating APIs.
