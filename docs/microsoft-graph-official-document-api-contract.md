# Microsoft Graph Official Document API Contract

These are future endpoints only. No implementation is present now.

## 1. POST /api/document-sync/microsoft/official-documents/candidates/preview
**Purpose:** Preview parser spike records eligible to become official document candidates. No official record creation.
- **Method:** POST
- **Permission:** PREVIEW_OFFICIAL_DOCUMENT_IMPORT
- **Environment Gate:** Staging only (`ALLOW_MICROSOFT_GRAPH_CONTENT_INGESTION_PROTOTYPE=YES`)
- **Request Body:** `{ runId, itemId, hash }`
- **Response Body:** `{ eligible, safetySummary }`
- **Confirmation Phrase:** None required for preview.
- **Forbidden Flags:** production, createCaseLink, ragIndex, exposeFullContent.
- **Audit Requirement:** Log preview action.

## 2. POST /api/document-sync/microsoft/official-documents/candidates
**Purpose:** Create staging-only official document import candidate. Not implemented now.
- **Method:** POST
- **Permission:** CREATE_OFFICIAL_DOCUMENT_IMPORT_CANDIDATE
- **Environment Gate:** Staging only
- **Request Body:** `{ sourceRunId, sourceItemHash, classification, operatorReason, confirmationPhrase }`
- **Confirmation Phrase:** `CREATE_STAGING_DOCUMENT_CANDIDATE_ONLY`
- **Response Body:** `{ candidateId, status }`
- **Forbidden Flags:** production, createCaseLink, ragIndex, microsoftWriteback, overwriteExisting, exposeRawIds.

## 3. GET /api/document-sync/microsoft/official-documents/candidates
**Purpose:** Read candidate list.
- **Method:** GET
- **Permission:** VIEW_OFFICIAL_DOCUMENT_IMPORT_CANDIDATES
- **Environment Gate:** Staging only
- **Forbidden Flags:** exposeRawIds, exposeFullContent.

## 4. GET /api/document-sync/microsoft/official-documents/candidates/[id]
**Purpose:** Read candidate detail with permission-safe preview.
- **Method:** GET
- **Permission:** VIEW_OFFICIAL_DOCUMENT_IMPORT_CANDIDATES
- **Environment Gate:** Staging only
- **Forbidden Flags:** exposeFullContent, exposeRawIds.

## 5. POST /api/document-sync/microsoft/official-documents/candidates/[id]/review
**Purpose:** Approve/reject/request redaction. Not implemented now.
- **Method:** POST
- **Permission:** REVIEW_OFFICIAL_DOCUMENT_IMPORT_CANDIDATE
- **Environment Gate:** Staging only
- **Request Body:** `{ decision, notes }`
- **Confirmation Phrase:** Required for approval.

## 6. POST /api/document-sync/microsoft/official-documents/candidates/[id]/promote-staging
**Purpose:** Future staging-only promotion into official document workflow. Not implemented now.
- **Method:** POST
- **Permission:** EXECUTE_STAGING_OFFICIAL_DOCUMENT_PROMOTION
- **Environment Gate:** Staging only
- **Confirmation Phrase:** `PROMOTE_STAGING_DOCUMENT_ONLY`
- **Forbidden Flags:** production, microsoftWriteback, createCaseLink, ragIndex.

## 7. GET /api/document-sync/microsoft/official-documents/audit
**Purpose:** Read-only audit.
- **Method:** GET
- **Permission:** VIEW_OFFICIAL_DOCUMENT_IMPORT_AUDIT
- **Forbidden Flags:** exposeRawIds, exposeFullContent.

## Common Constraints
- **Production Block:** All candidate/promotion routes blocked in production environment.
- **Sanitization Requirement:** Responses must strip tokens, raw URLs, and raw Graph fields.
