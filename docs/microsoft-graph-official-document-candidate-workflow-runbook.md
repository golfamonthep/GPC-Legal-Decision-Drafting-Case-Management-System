# Microsoft Graph Official Document Candidate Workflow Runbook

*Implementation currently BLOCKED.*

1. Preconditions:
   * Prompt 75 design gate complete.
   * Prompt 74 parser spike UAT passed.
   * staging DB confirmed.
   * env flag enabled in staging only: `ALLOW_OFFICIAL_DOCUMENT_CANDIDATE_WORKFLOW=YES`
   * authorized operator has create permission.
   * authorized reviewer has review permission.

2. Steps:
   * open staging candidate workflow page
   * run candidate preview
   * verify eligible parser result
   * enter reason
   * choose PUBLIC_TEST or INTERNAL_TEST
   * enter confirmation phrase
   * create candidate
   * review candidate
   * reject/request redaction/quarantine/mark ready for staging review
   * verify audit

3. Expected results:
   * candidate created
   * officialDocumentCreated false
   * linkedCaseId null
   * ragIndexApproved false
   * Microsoft 365 writeback false

4. Stop conditions:
   * real document appears
   * production detected
   * official Document created
   * case link created
   * RAG indexed
   * raw ID/secret/full content exposed
   * Microsoft 365 writeback detected
   * delete/purge appears
