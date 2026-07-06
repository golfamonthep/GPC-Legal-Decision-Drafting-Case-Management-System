# Microsoft Graph Official Document Candidate Workflow Policy

*Note: This policy is conceptually documented but implementation is currently BLOCKED pending Prompt 75 approvals and Prompt 74 UAT.*

1. Staging only.
2. Fake parser results only.
3. Candidate is not official Document.
4. Candidate is not case-linked.
5. Candidate is not RAG-indexed.
6. Candidate is not Microsoft 365 writeback.
7. Candidate must keep provenance.
8. Candidate must keep classification.
9. Candidate must be reviewable.
10. Candidate must be rejectable.
11. Candidate must be quarantine-able.
12. Candidate must support “needs redaction” status.
13. Candidate must never overwrite existing official records.
14. Candidate must not display full content to unauthorized users.
15. Candidate must not expose raw Microsoft IDs/URLs.
16. Candidate creation requires reason and confirmation phrase.
17. Candidate review requires separate permission.
18. Promotion to official Document is out of scope.
19. Production is blocked.
20. Delete/purge is prohibited.

Candidate statuses:
- CANDIDATE_CREATED
- REVIEW_PENDING
- REVIEW_APPROVED
- REVIEW_REJECTED
- NEEDS_REDACTION
- QUARANTINED
- READY_FOR_STAGING_PROMOTION
- PROMOTED_IN_STAGING
- BLOCKED
- FAILED_SAFE

For this prompt:
- PROMOTED_IN_STAGING must not be used unless only represented as future enum/status and no actual official Document is created.
- READY_FOR_STAGING_PROMOTION may be set by review only if clearly documented as not actual promotion.
