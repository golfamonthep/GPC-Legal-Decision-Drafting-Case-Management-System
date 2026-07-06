# Microsoft Graph DOCX/PDF Future API Contract

*Note: These are future endpoints only. No implementation exists in the current phase.*

## 1. POST `/api/document-sync/microsoft/content-ingestion/file-type-expansion/preview`
- **Purpose:** Preview DOCX/PDF candidates. No content download.
- **Method:** `POST`
- **Permission:** `PREVIEW_DOCUMENT_FILE_TYPE_EXPANSION`
- **Environment Gate:** Staging only (`ALLOW_MICROSOFT_GRAPH_CONTENT_INGESTION_PROTOTYPE=YES`)
- **Request Body:** `{ "folderId": "string" }`
- **Response Body:** `{ "candidates": [...], "blocked": [...] }`
- **Forbidden Flags:** Production, Non-test files.
- **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`.
- **Audit Requirement:** Standard request audit logging (no PII/content).
- **Sanitization Requirement:** No raw URLs exposed.
- **Production Block:** Must return `403 Forbidden` in production.

## 2. POST `/api/document-sync/microsoft/content-ingestion/file-type-expansion/prototype`
- **Purpose:** Staging-only DOCX/PDF extraction prototype (future prompt only).
- **Method:** `POST`
- **Permission:** `EXECUTE_DOCUMENT_FILE_TYPE_EXPANSION`
- **Environment Gate:** Staging only
- **Request Body:** `{ "fileIds": ["..."], "confirmationPhrase": "STAGING_DOCX_PDF_TEST_ONLY" }`
- **Response Body:** `{ "results": [...], "quarantined": [...] }`
- **Forbidden Flags:** Missing confirmation phrase, Production.
- **Error Codes:** `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`.
- **Audit Requirement:** Execution audit log (no content).
- **Sanitization Requirement:** Truncate previews.
- **Production Block:** Must return `403 Forbidden` in production.

## 3. GET `/api/document-sync/microsoft/content-ingestion/file-type-expansion/runs`
- **Purpose:** Read-only run history.
- **Method:** `GET`
- **Permission:** `VIEW_DOCUMENT_FILE_TYPE_EXPANSION_AUDIT`
- **Environment Gate:** Staging only
- **Request Body:** N/A
- **Response Body:** `{ "runs": [...] }`
- **Forbidden Flags:** N/A
- **Error Codes:** `401 Unauthorized`, `403 Forbidden`.
- **Audit Requirement:** None.
- **Sanitization Requirement:** None.
- **Production Block:** Must return `403 Forbidden`.

## 4. GET `/api/document-sync/microsoft/content-ingestion/file-type-expansion/quarantine`
- **Purpose:** Read-only expanded quarantine reasons.
- **Method:** `GET`
- **Permission:** `REVIEW_DOCUMENT_FILE_TYPE_EXPANSION_QUARANTINE`
- **Environment Gate:** Staging only
- **Request Body:** N/A
- **Response Body:** `{ "items": [...] }`
- **Forbidden Flags:** N/A
- **Error Codes:** `401 Unauthorized`, `403 Forbidden`.
- **Audit Requirement:** None.
- **Sanitization Requirement:** None.
- **Production Block:** Must return `403 Forbidden`.

## Required Confirmation Phrase
- `STAGING_DOCX_PDF_TEST_ONLY`

## Required Permissions
- `PREVIEW_DOCUMENT_FILE_TYPE_EXPANSION`
- `EXECUTE_DOCUMENT_FILE_TYPE_EXPANSION`
- `VIEW_DOCUMENT_FILE_TYPE_EXPANSION_AUDIT`
- `REVIEW_DOCUMENT_FILE_TYPE_EXPANSION_QUARANTINE`
