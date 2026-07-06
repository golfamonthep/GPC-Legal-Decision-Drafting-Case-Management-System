# Evidence Index

| Evidence ID | Test case | Route/UI | Expected result | Actual result | Evidence type | Sanitized evidence location | Pass/Fail/Blocked | Notes |
|---|---|---|---|---|---|---|---|---|
| EV-01 | Environment check | staging login / banner | Banner visible, no real documents | Blocked | N/A | EV-01-environment-check.md | BLOCKED | Pending owner confirmation |
| EV-02 | Preview candidates | `/api/document-sync/microsoft/content-ingestion/docx-pdf/preview` | Fake docs allowed, invalid blocked | Blocked | N/A | EV-02-preview-candidates.md | BLOCKED | |
| EV-03 | DOCX extraction | prototype run | Extract limited text safely | Blocked | N/A | EV-03-docx-extraction.md | BLOCKED | |
| EV-04 | PDF text-layer extraction | prototype run | Extract text layer safely | Blocked | N/A | EV-04-pdf-text-layer-extraction.md | BLOCKED | |
| EV-05 | Blocked scanned/encrypted/macro | prototype run | Block/quarantine unsupported files | Blocked | N/A | EV-05-blocked-scanned-encrypted-macro.md | BLOCKED | |
| EV-06 | Negative tests | multiple | Reject invalid flags/auth | Blocked | N/A | EV-06-negative-tests.md | BLOCKED | |
| EV-07 | Quarantine review | quarantine UI | Display quarantined files safely | Blocked | N/A | EV-07-quarantine-review.md | BLOCKED | |
| EV-08 | Production block | production routes | 401/403/423 blocked | Blocked | N/A | EV-08-production-block.md | BLOCKED | |
| EV-09 | No document no RAG | DB / UI | No official doc or RAG records created | Blocked | N/A | EV-09-no-document-no-rag-verification.md | BLOCKED | |
| EV-10 | Build & security | Terminal / Git | Build passes, no secrets exposed | Passed | Text | EV-10-build-and-security-verification.md | BLOCKED | Implementation is missing |
