# Microsoft Graph DOCX/PDF Schema Impact Review

This document reviews the current schema and assesses the impact of the future DOCX/PDF expansion.

## Current Models Evaluated
- `GraphContentIngestionPrototypeRun`
- `GraphContentIngestionPrototypeItem`
- `GraphContentIngestionQuarantineItem`

## Future Field Additions (When Implemented)
If DOCX/PDF expansion is implemented in the future, the following fields may be necessary. They are **NOT** added in this prompt.

1. **New Fields:**
   - `parserName`: The parser library used (e.g., `mammoth`, `pdf-parse`).
   - `parserVersion`: The version of the parser.
   - `extractionMethod`: e.g., `TEXT_LAYER`, `RAW_XML`.
   - `pageCount`: Total pages in the file (if applicable).
   - `pagesProcessed`: Number of pages extracted before limit.
   - `extractionLimitApplied`: Boolean indicating if content was truncated.
   - `encryptedDetected`: Boolean flag for encrypted files.
   - `scannedPdfDetected`: Boolean flag for scanned/image-only PDFs.
   - `embeddedObjectDetected`: Boolean flag for embedded files.
   - `parserErrorCode`: Specific error code from the parser.

2. **Model Strategy:**
   - **Reuse vs. New Models:** We will likely reuse the existing prototype models (`GraphContentIngestionPrototypeItem`, `GraphContentIngestionQuarantineItem`) and add the fields above as nullable columns, rather than creating entirely new `GraphFileTypeExpansionRun` models. This keeps the schema consolidated for the staging prototype.

## Rules Enforced in Prompt 72
- **No Prisma schema edit** is made in this prompt (unless adding purely documentation comments).
- **No migration** is run.
- **No DB mutation** occurs.
