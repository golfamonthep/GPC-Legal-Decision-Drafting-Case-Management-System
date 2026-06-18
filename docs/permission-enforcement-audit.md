# Permission Enforcement Audit

This document details the backend and frontend permission enforcement currently active in the application, specifically focusing on routes and their respective guards.

## 1. Pages with Permission Guard

These pages use `requirePermission` which enforces authentication and role checks server-side before rendering.

* `/admin/readiness` -> `MANAGE_USERS`
* `/admin/system` -> `VIEW_ADMIN_CONSOLE`
* `/admin/permissions` (Added for UAT) -> `MANAGE_USERS`
* `/assignments` -> `VIEW_ASSIGNMENTS`
* `/case-intelligence` -> `ADVANCED_CASE_SEARCH`
* `/cases/[id]/draft` -> `VIEW_DRAFT`
* `/cases/[id]` -> `VIEW_CASE_DETAIL`
* `/cases` -> `VIEW_CASES`
* `/dashboard` -> `VIEW_DASHBOARD`
* `/data-quality` -> `VIEW_DATA_QUALITY`
* `/dispatch` -> `VIEW_DISPATCH_WORKFLOW`
* `/executive` -> `VIEW_EXECUTIVE_DASHBOARD`
* `/registry/import` -> `IMPORT_REGISTRY`
* `/search` -> `ADVANCED_CASE_SEARCH`
* `/document-sync` -> `VIEW_DOCUMENT_SYNC`

## 2. API Routes with Permission Guard

These routes use `requireApiPermission` to ensure strict backend checks.

* `/api/admin/audit` -> `VIEW_ADMIN_CONSOLE`
* `/api/admin/jobs` -> `VIEW_ADMIN_CONSOLE`
* `/api/admin/security-signals` -> `VIEW_ADMIN_CONSOLE`
* `/api/admin/system-health` -> `VIEW_ADMIN_CONSOLE`
* `/api/admin/usage` -> `VIEW_ADMIN_CONSOLE`
* `/api/admin/users` -> `MANAGE_USERS`
* `/api/admin/users/[id]` -> `MANAGE_USERS`
* `/api/assignments` -> `VIEW_WORKLOAD`
* `/api/assignments/bulk` -> `ASSIGN_CASES`
* `/api/assignments/export` -> `EXPORT_WORKLOAD_REPORT`
* `/api/cases/[id]/assignment` -> `ASSIGN_CASES`
* `/api/cases/[id]/documents` -> `VIEW_DOCUMENTS` / `LINK_DOCUMENTS`
* `/api/cases/[id]/export-docx` -> `EXPORT_DOCX`
* `/api/data-quality/cases/[id]/quick-fix` -> `CLEANUP_DATA_QUALITY`
* `/api/data-quality/export` -> `EXPORT_DATA_QUALITY_REPORT`
* `/api/data-quality/issues` -> `VIEW_DATA_QUALITY`
* `/api/draft/check-citations` -> `USE_AI_REVIEW`
* `/api/draft/review-wording` -> `USE_AI_REVIEW`
* `/api/draft/section-ai` -> `USE_AI_DRAFT`
* `/api/registry/import` -> `IMPORT_REGISTRY`
* `/api/reports/executive/export` -> `EXPORT_EXECUTIVE_REPORT`
* `/api/search/cases/export` -> `EXPORT_SEARCH_RESULTS`
* `/api/document-sync/microsoft/status` -> `VIEW_DOCUMENT_SYNC`
* `/api/document-sync/microsoft/preview` -> `PREVIEW_DOCUMENT_SYNC`
* `/api/document-sync/microsoft/connectivity-test` -> `MANAGE_DOCUMENT_SYNC` (Planned)

## 3. Routes that Manually Call `hasPermission`

These routes enforce permissions by manually fetching `getCurrentUser` and checking `hasPermission`.

* `/finalization` -> `VIEW_POST_MEETING_FOLLOWUP`
* `/meetings` -> `VIEW_MEETINGS`
* `/api/meetings` -> `VIEW_MEETINGS` (GET), `MANAGE_MEETINGS` (POST)

## 4. Under-protected Routes / Risk Items

Based on the audit, the following routes might rely solely on NextAuth middleware or lack explicit granular permission requirements beyond authentication.

* **`/rag` endpoints and `/legal-qa`**: RAG client pages might be accessible to all authenticated users. (Note: The backend API `/api/rag/qa` and `/api/rag/retrieval` are now protected by `USE_AI_REVIEW`, and the `/library` server page is protected by `VIEW_RECORDS_ARCHIVE`).
* **`/api/cases/[id]/finalization/*` routes**: Needs manual review to ensure `FINALIZE_DECISION` or `RECORD_RED_CASE_NUMBER` are strictly checked before mutating finalization states.

*Risk Assessment:* None of these missing permissions expose secrets or bypass authentication. They are "authenticated access" boundaries that may need to be tightened for specific roles in the future. 

## 5. Routes that Need Manual Review

* The new `rag` API endpoints client UI should be reviewed in the next phase to incorporate the `VIEW_RECORDS_ARCHIVE` and `APPROVE_KNOWLEDGE_REUSE` permissions where applicable. (Backend `rag` API and `/library` server page are now protected).
* **Archive Execution**: The `POST /api/records-retention/archive/preview` endpoint correctly enforces `MANAGE_RECORDS_ARCHIVE`. However, `MANAGE_RECORDS_ARCHIVE` is too broad. A new `PREVIEW_ARCHIVE` and `EXECUTE_ARCHIVE` permission must be introduced before building the final execution route. Code audit passed is not live UAT passed. Production release is NO-GO.
* **Microsoft Graph Connectivity**: The endpoint must require `MANAGE_DOCUMENT_SYNC` and run strictly within an environment-gated execution path (production blocked, live staging blocked until owner confirms).

## Recommendation

Do not apply broad refactors to auth enforcement mechanisms without corresponding UI updates to hide buttons. A future prompt should harden the Finalization mutating APIs to explicitly use `requireApiPermission`.
