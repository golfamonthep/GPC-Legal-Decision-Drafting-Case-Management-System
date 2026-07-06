# Microsoft Graph DOCX/PDF File-Type Expansion Design Gate

## 1. Current `.txt` / `.md` Prototype Status
- **Status:** BLOCKED
- **Reason:** The Prompt 71 Operator Trial was blocked because the required Prompt 70 hardening, release gate approvals, and owner confirmations for staging environments were not met.

## 2. Prompt 71 Operator Trial Result
- **Result:** BLOCKED. The trial could not proceed due to missing prerequisite confirmations.

## 3. Current Defects Summary
- Refer to `docs/evidence/graph-content-operator-trial/defect-log.md` for full defects log, but the overarching issue is a blocked prerequisite gate. No Severity A/B defects from actual run because the run was blocked.

## 4. Proposed Expansion Scope
- **Included:**
  - `.docx`
  - `.pdf`

## 5. Explicitly Out of Scope
- scanned PDFs/OCR
- encrypted PDFs
- password-protected files
- macro-enabled Office files (`.docm`)
- Excel macros (`.xlsm`)
- PowerPoint macros (`.pptm`)
- Excel spreadsheets (`.xlsx`)
- images
- archives
- audio/video
- real official documents
- production ingestion
- official Document creation
- RAG indexing

## 6. Gate Decision
- **Decision:** NO-GO
- **Reason:** Prompt 71 operator trial for `.txt`/`.md` did not pass. Any file-type expansion is strictly prohibited until the baseline prototype passes operator trial and owner confirmation.

## 7. Required Approvals Before Implementation
- Owner confirmation of Staging DB separation.
- Passed Prompt 71 operator trial.
- Security and Business Owner approval (via Approval Form).

## 8. Required Staging UAT Before Any Production Consideration
- Full Staging UAT must be performed against fake `.docx` and searchable `.pdf` test files in the staging environment before any production rollout or real file ingestion can be considered.
