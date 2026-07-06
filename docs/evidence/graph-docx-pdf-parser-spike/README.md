# DOCX/PDF Parser Spike Evidence Pack

## Objective
Conduct a controlled UAT for the DOCX/PDF staging parser spike and produce a sanitized evidence pack. 
The UAT must prove that only fake `.docx` and searchable text-layer `.pdf` files are processed in staging, scanned/encrypted/macro/unsupported files are blocked or quarantined safely, production remains blocked, no Microsoft 365 writeback occurs, no official Document records are created, and no RAG/vector indexing occurs.

## Scope
- Staging only
- Fake `.docx`
- Searchable text-layer `.pdf`

## Out of Scope
- Production
- Real legal/case documents
- OCR
- Scanned PDFs
- Encrypted PDFs
- Macro-enabled files
- Official Document creation
- RAG indexing

## Evidence Sanitization Rules
- Do not include screenshots with secrets, raw IDs, tokens, cookies, full content, raw URLs, or real filenames.
- Redact unsafe text before committing screenshots.
- If safe screenshot redaction is not practical, use sanitized written evidence notes.

## Evidence List
- EV-01: Environment check
- EV-02: Preview candidates
- EV-03: DOCX extraction
- EV-04: PDF text-layer extraction
- EV-05: Blocked scanned/encrypted/macro
- EV-06: Negative tests
- EV-07: Quarantine review
- EV-08: Production block
- EV-09: No document/no RAG verification
- EV-10: Build and security verification

## Final Result
**BLOCKED** (Prompt 73 parser spike is blocked pending owner confirmation)
