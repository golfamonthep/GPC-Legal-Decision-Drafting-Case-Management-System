# Microsoft Graph DOCX/PDF Future Staging UAT Plan

*This document defines the staging UAT plan for the future DOCX/PDF extraction prototype.*

## Constraints
- **Fake test files only.**
- **Staging environment only.**

## Allowed Test Files
These files must be successfully extracted up to the extraction limit.
- `TEST_DOCX_PUBLIC_001.docx`
- `TEST_DOCX_INTERNAL_001.docx`
- `TEST_PDF_PUBLIC_TEXT_001.pdf`
- `TEST_PDF_INTERNAL_TEXT_001.pdf`

## Blocked Test Files
These files must fail safely and be sent to quarantine.
- `BLOCKED_PDF_SCANNED_001.pdf`
- `BLOCKED_PDF_ENCRYPTED_001.pdf`
- `BLOCKED_DOCX_MACRO_001.docm`
- `BLOCKED_DOCX_EMBEDDED_OBJECT_001.docx`
- `BLOCKED_TOO_LARGE_001.pdf`
- `BLOCKED_UNKNOWN_SENSITIVITY_001.pdf`

## UAT Cases
1. **Unauthenticated blocked:** Access to endpoints without valid token returns `401`.
2. **Unauthorized blocked:** Access without `EXECUTE_DOCUMENT_FILE_TYPE_EXPANSION` returns `403`.
3. **Preview-only user can preview:** User with `PREVIEW` permission can run candidate check but not extract.
4. **Execute user can run staging prototype:** User with `EXECUTE` permission can run extraction.
5. **Production blocked:** Attempting to run in production returns `403`.
6. **DOCX text extraction limited:** Valid DOCX is extracted up to character limit (e.g., 5000 chars).
7. **PDF text-layer extraction limited:** Valid PDF is extracted up to page/character limit.
8. **Scanned PDF quarantined:** File without text layer is quarantined with `PDF_SCANNED_OR_NO_TEXT_LAYER`.
9. **Encrypted PDF quarantined:** File requiring password is quarantined with `PDF_ENCRYPTED_BLOCKED`.
10. **Macro-enabled Office blocked:** `.docm` is quarantined with `DOCX_MACRO_ENABLED_BLOCKED`.
11. **Too-large file blocked:** Files over 500 KB are quarantined with `EXTRACTION_LIMIT_EXCEEDED`.
12. **Unknown sensitivity blocked:** Missing sensitivity label results in quarantine.
13. **Parser failure quarantined:** Corrupt files fail safely and are quarantined with `PARSER_ERROR_SAFE`.
14. **No official Document creation:** Ensure `Document` table has no new records.
15. **No RAG indexing:** Ensure pgvector/RAG tables have no new records.
16. **No Microsoft 365 writeback:** Ensure test files in Graph remain unmodified.
17. **No full content in UI/logs:** Ensure logs and UI response only show truncated preview.
18. **No delete/purge:** Ensure no document deletion functionality is exposed or triggered.
