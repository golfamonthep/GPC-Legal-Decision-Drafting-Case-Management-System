# Microsoft Graph Content Quarantine Workflow

## Overview
Quarantine means an internal system review status for blocked external document candidates during the Microsoft Graph content ingestion process.

## Core Rules
1. **Quarantine is not delete**: It must not modify, rename, delete, move, or otherwise alter files in Microsoft 365 (SharePoint/OneDrive).
2. **No Content Download**: The system must not download the content of blocked files.
3. **No Official Document Records**: Quarantined items do not result in official `Document` or `CaseDocument` records.
4. **No RAG Indexing**: Quarantined items are strictly excluded from RAG and vector indexing.
5. **Read-Only by Default**: Review operations are staging-only, permission-gated, and must not mistakenly release files into production indexing.

## Quarantine Reasons
A file is quarantined if it triggers any of the following reasons:
- `UNSUPPORTED_FILE_TYPE`
- `UNKNOWN_SENSITIVITY`
- `FILE_TOO_LARGE`
- `MACRO_ENABLED_BLOCKED`
- `ARCHIVE_BLOCKED`
- `ENCRYPTED_OR_PASSWORD_PROTECTED`
- `REAL_DATA_NOT_ALLOWED`
- `CONFIDENTIALITY_NOT_APPROVED`
- `CONTENT_DOWNLOAD_NOT_ALLOWED`
- `PRODUCTION_BLOCKED`
- `POLICY_BLOCKED`
- `EXTRACTION_FAILED_SAFE`

## Quarantine Statuses
- `QUARANTINED`
- `REVIEW_PENDING`
- `APPROVED_FOR_FUTURE_TEST`
- `REJECTED`
- `RELEASED_FROM_QUARANTINE_METADATA_ONLY`
- `ESCALATED`

## Architecture and Database
- Uses `GraphContentIngestionQuarantineItem` schema.
- Data is strictly additive and metadata-only (size, name, mimeType).
- No raw IDs or raw URLs are exposed in the quarantine UI.

## File-Type Expansion (Prompt 72 Updates)
1. DOCX/PDF expansion is design-only.
2. DOCX/PDF extraction not implemented.
3. Parser selection pending.
4. OCR not approved.
5. Scanned PDFs blocked.
6. Encrypted PDFs blocked.
7. Macro-enabled files blocked.
8. Official Document creation remains blocked.
9. RAG indexing remains blocked.
10. Production remains NO-GO.
