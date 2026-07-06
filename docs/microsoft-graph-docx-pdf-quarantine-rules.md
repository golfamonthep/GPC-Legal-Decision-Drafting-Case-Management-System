# Microsoft Graph DOCX/PDF Quarantine Expansion Rules

## New Quarantine Reasons

The following quarantine reasons are added to handle DOCX/PDF expansion:

- `DOCX_PARSER_NOT_APPROVED`
- `PDF_PARSER_NOT_APPROVED`
- `PDF_SCANNED_OR_NO_TEXT_LAYER`
- `PDF_ENCRYPTED_BLOCKED`
- `PDF_TOO_MANY_PAGES`
- `DOCX_MACRO_ENABLED_BLOCKED`
- `DOCX_UNSUPPORTED_STRUCTURE`
- `EMBEDDED_OBJECT_BLOCKED`
- `EXTRACTION_LIMIT_EXCEEDED`
- `PARSER_ERROR_SAFE`
- `FILE_TYPE_EXPANSION_NOT_APPROVED`

## Expanded Rules

1. **Candidate Preview:** DOCX/PDF candidate preview may classify files as allowed or blocked based on metadata and the above reasons.
2. **Download Block:** No DOCX/PDF content download is allowed until a future implementation gate is passed.
3. **Fail Safe:** Any failed parser result must trigger quarantine, not a system crash.
4. **No Production Ingestion:** Quarantine review may not approve production ingestion.
5. **No RAG Indexing:** Quarantine review may not trigger RAG indexing.
6. **No 365 Writeback:** Quarantine review may not alter Microsoft 365 files.
7. **No Delete/Purge:** Delete/purge actions remain strictly prohibited.
