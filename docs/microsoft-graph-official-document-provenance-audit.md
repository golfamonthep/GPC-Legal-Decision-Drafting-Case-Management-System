# Microsoft Graph Official Document Provenance & Audit Requirements

## Provenance Tracking Requirements
Provenance must track the following fields/states:
1. External provider.
2. Source metadata run.
3. Content ingestion run.
4. Parser spike run.
5. Source item hash.
6. Content hash.
7. Parser name/version.
8. Extraction method.
9. Extraction limit applied.
10. Classification.
11. Operator.
12. Reviewer.
13. Approval decision.
14. Candidate status.
15. Promotion status.
16. Case linkage status.
17. RAG status.
18. Production status.

## Audit Rules
1. No raw content in audit logs.
2. No raw Microsoft IDs in audit logs.
3. No secrets.
4. No raw Graph response.
5. Audit must distinguish:
   - preview
   - candidate creation
   - review
   - rejection
   - quarantine
   - staging promotion
   - production block
6. Audit must explicitly show:
   - `documentCreated: false` until actual future promotion.
   - `ragIndexed: false` unless future gate.
   - `microsoftWriteback: false` always unless separate future gate.
