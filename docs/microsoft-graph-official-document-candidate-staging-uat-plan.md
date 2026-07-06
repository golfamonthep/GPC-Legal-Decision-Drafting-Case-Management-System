# Microsoft Graph Official Document Candidate Staging UAT Plan

This plan uses fake parser results only.

## UAT Cases
1. Unauthenticated blocked.
2. Unauthorized blocked.
3. Operator can preview eligible parser results.
4. Operator can create candidate only in staging.
5. Reviewer can approve/reject/request redaction.
6. Viewer cannot create/review/promote.
7. Production candidate creation blocked.
8. `UNKNOWN_SENSITIVITY` blocks candidate creation.
9. Duplicate candidate blocked or flagged.
10. Candidate does not create official Document record yet if only candidate trial.
11. Staging promotion creates official workflow record only in future prompt, not now.
12. No case link created automatically.
13. No RAG indexing.
14. No Microsoft 365 writeback.
15. No delete/purge.
16. Audit/provenance recorded.
17. Rollback/rejection status works.
