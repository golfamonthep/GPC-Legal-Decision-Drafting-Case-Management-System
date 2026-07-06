# Microsoft Graph DOCX/PDF Extraction Boundary

This document defines the strict future extraction limits for the DOCX/PDF content ingestion prototype.

1. **Environment:**
   - Staging only.

2. **File count:**
   - Default max: 2 files per test run.
   - Hard max: 3 files.

3. **File size:**
   - Recommended max: 500 KB for DOCX/PDF first UAT.

4. **Page limit for PDF:**
   - Recommended: First 3 pages only.

5. **Character extraction limit:**
   - Recommended max: 5,000 characters internally.

6. **UI preview:**
   - Recommended max: 500 characters displayed in UI.

7. **Storage:**
   - Store content hash.
   - Store limited extracted preview *only if approved*.
   - **Do not** store full raw content in this phase.

8. **Logging:**
   - No content logging allowed.

9. **Error handling:**
   - Fail safe.
   - Quarantine on parser error.

10. **Classification:**
    - `PUBLIC_TEST` or `INTERNAL_TEST` only.

11. **Block conditions:**
    - Unknown sensitivity.
    - Unsupported file type.
    - Encrypted/password-protected files.
    - Macro-enabled files (`.docm`, `.xlsm`, `.pptm`).
    - Binary/malformed files.
    - Scanned/OCR-required PDFs.
    - File too large.
