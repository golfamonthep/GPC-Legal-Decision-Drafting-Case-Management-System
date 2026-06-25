# Microsoft Graph Content Ingestion Prototype — Staging Operator Trial Evidence Pack

## Trial Objective
Conduct a controlled staging operator trial for the Microsoft Graph content ingestion prototype to prove that the prototype works only for fake `.txt` and `.md` files in staging, blocks unsupported files into quarantine without downloading them, does not modify Microsoft 365 files, does not create official Document records, does not index RAG, and remains blocked in production.

## Trial Scope
- Verification of staging-only environment flags.
- Dry-run preview of content extraction for `.txt` and `.md` fake files.
- Prototype execution for text/markdown mock files.
- Quarantine review pipeline for unsupported files.
- Verification of safety boundaries (no RAG, no official records, no writeback).

## Trial Date
[Placeholder for date: PENDING EXECUTION]

## Environment
- Staging / Preview ONLY.
- Production is strictly blocked.

## Roles
- Operator Role: Legal Officer / Admin (executing the prototype)
- Reviewer Role: Commissioner / Admin (reviewing quarantine)

## Approved File Types
- `.txt`
- `.md`

## Blocked File Types
- `.pdf`
- `.docx`
- `.xlsx`
- `.zip`
- Macro files (`.docm`, etc.)
- Binary files
- Unknown sensitivity files

## Evidence List
See `evidence-index.md` for a comprehensive log of all tests and their results.

## Sanitization Rules
- Do not include screenshots with secrets, raw IDs, tokens, cookies, full content, raw URLs, or real filenames.
- Redact unsafe text before committing evidence.
- If safe screenshots cannot be redacted, do not commit them; document a manual evidence note instead.

## Final Outcome
**BLOCKED**

*Reason for block*: Prompt 70 hardening and release gates are missing. The Owner Confirmation Gate failed. Live execution cannot proceed.
