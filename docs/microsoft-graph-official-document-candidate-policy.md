# Microsoft Graph Official Document Candidate Policy

1. Parser output must first become a candidate, not an official document.
2. Candidate records must be staging-only until approved.
3. Candidate creation must require:
   - source run ID
   - source item hash
   - file classification
   - operator reason
   - reviewer approval
   - confirmation phrase
4. Candidate must not automatically link to a case.
5. Candidate must not automatically enter RAG.
6. Candidate must not overwrite existing records.
7. Candidate must preserve provenance.
8. Candidate must preserve parser metadata.
9. Candidate must be reviewable before promotion.
10. Candidate must support rejection/quarantine.
11. Candidate must not display full content to unauthorized users.
12. Candidate must not expose raw Microsoft IDs or URLs.
13. Candidate must not trigger Microsoft 365 writeback.
14. Candidate must not delete/purge external files.
15. Production official document creation requires a separate release gate.

## Candidate Statuses:
- `CANDIDATE_CREATED`
- `REVIEW_PENDING`
- `REVIEW_APPROVED`
- `REVIEW_REJECTED`
- `NEEDS_REDACTION`
- `QUARANTINED`
- `READY_FOR_STAGING_PROMOTION`
- `PROMOTED_IN_STAGING`
- `BLOCKED`
- `FAILED_SAFE`
