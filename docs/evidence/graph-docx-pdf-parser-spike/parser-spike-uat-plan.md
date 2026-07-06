# DOCX/PDF Parser Spike UAT Plan

## A. Access and environment
1. Login to staging.
2. Confirm staging banner.
3. Confirm production disabled state.
4. Confirm fake DOCX/PDF folder only.
5. Confirm no real official documents.

## B. Preview
1. Run DOCX/PDF preview.
2. Confirm fake `.docx` candidates are allowed.
3. Confirm searchable text-layer `.pdf` candidates are allowed.
4. Confirm scanned PDF is blocked/quarantined.
5. Confirm encrypted PDF is blocked/quarantined.
6. Confirm macro-enabled Office file is blocked/quarantined.
7. Confirm too-large file is blocked/quarantined.
8. Confirm no content downloaded during preview.

## C. Execute parser spike
1. Enter reason.
2. Select classification: PUBLIC_TEST or INTERNAL_TEST
3. Enter confirmation phrase: STAGING_DOCX_PDF_TEST_ONLY
4. Execute parser spike.
5. Confirm only fake `.docx` and searchable `.pdf` files are downloaded.
6. Confirm extracted preview is limited.
7. Confirm parser warnings are clear.
8. Confirm scanned/encrypted/macro files are not downloaded.
9. Confirm quarantine records are created for blocked files.
10. Confirm no official Document records.
11. Confirm no RAG/vector records.
12. Confirm no Microsoft 365 writeback.

## D. Negative tests
1. Missing reason.
2. Wrong confirmation phrase.
3. Invalid classification.
4. Attempt OCR flag.
5. Attempt `processScannedPdf=true`.
6. Attempt `ragIndex=true`.
7. Attempt `createOfficialDocuments=true`.
8. Attempt delete/purge.
9. Unauthorized user.
10. Production route.

## E. Safety checks
1. No full content in UI/API/logs.
2. No raw Microsoft IDs.
3. No raw URLs.
4. No tokens/secrets.
5. No production DB mutation.
6. No official Document creation.
7. No RAG indexing.
8. No Microsoft 365 writeback.
