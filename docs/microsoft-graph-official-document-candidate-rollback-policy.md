# Microsoft Graph Official Document Candidate Rollback Policy

## Rules
1. Candidate rejection must not delete source Microsoft file.
2. Candidate rejection must not delete parser run evidence.
3. Candidate rejection may mark candidate as rejected.
4. Candidate can be quarantined for:
   - classification issue
   - parser quality issue
   - wrong source
   - duplicate candidate
   - sensitive data
   - suspected real document
5. Staging promotion rollback must be separately designed before implementation.
6. No delete/purge.
7. No Microsoft 365 writeback.
8. No production rollback needed because production is not approved.
