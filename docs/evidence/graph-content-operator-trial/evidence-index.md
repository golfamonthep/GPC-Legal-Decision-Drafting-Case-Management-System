# Operator Trial Evidence Index

| Evidence ID | Test Case | Route / UI | Expected Result | Actual Result | Evidence Type | Sanitized Evidence Location | Pass/Fail/Blocked | Notes |
|-------------|-----------|------------|-----------------|---------------|---------------|-----------------------------|-------------------|-------|
| EV-01 | Environment Check | `/document-sync` | Staging banner visible, production disabled | N/A | Log / Screenshot | `EV-01-environment-check.md` | BLOCKED | Missing Prompt 70 |
| EV-02 | Preview Candidates | `/api/.../preview` | `.txt` and `.md` allowed, unsupported blocked, no download | N/A | API Response | `EV-02-preview-candidates.md` | BLOCKED | Missing Prompt 70 |
| EV-03 | Execute Prototype | `/api/.../prototype` | Downloads only safe files, quarantine records created | N/A | API / Log | `EV-03-execute-prototype.md` | BLOCKED | Missing Prompt 70 |
| EV-04 | Quarantine Review | `/document-sync` | Blocked files visible, no files modified in MS Graph | N/A | UI / Log | `EV-04-quarantine-review.md` | BLOCKED | Missing Prompt 70 |
| EV-05 | Negative Tests | API endpoints | 400/403 errors, no download on missing phrase or bad file | N/A | API Response | `EV-05-permission-negative-tests.md`| BLOCKED | Missing Prompt 70 |
| EV-06 | Production Block | `/document-sync` | 401/403 or 423 Locked, production ingestion disabled | N/A | API / UI | `EV-06-production-block.md` | BLOCKED | Missing Prompt 70 |
| EV-07 | No Doc / No RAG | DB Queries | Prototype runs only; no Document or RAG vectors | N/A | DB Query | `EV-07-no-document-no-rag-verification.md` | BLOCKED | Missing Prompt 70 |
| EV-08 | Incident Readiness| SOP Review | Incident readiness checks pass | N/A | Document Review | `EV-08-incident-readiness.md` | BLOCKED | Missing Prompt 70 |
