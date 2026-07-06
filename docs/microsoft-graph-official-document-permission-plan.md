# Microsoft Graph Official Document Permission Plan

## Required Future Permissions
- `VIEW_OFFICIAL_DOCUMENT_IMPORT_CANDIDATES`
- `PREVIEW_OFFICIAL_DOCUMENT_IMPORT`
- `CREATE_OFFICIAL_DOCUMENT_IMPORT_CANDIDATE`
- `REVIEW_OFFICIAL_DOCUMENT_IMPORT_CANDIDATE`
- `APPROVE_STAGING_OFFICIAL_DOCUMENT_PROMOTION`
- `REJECT_OFFICIAL_DOCUMENT_IMPORT_CANDIDATE`
- `VIEW_OFFICIAL_DOCUMENT_IMPORT_AUDIT`
- `EXECUTE_STAGING_OFFICIAL_DOCUMENT_PROMOTION`

## Explicitly Not Granted
- Production official ingestion
- RAG indexing
- Microsoft 365 writeback
- Delete/purge

## Role Mapping Proposal

1. **SYSTEM_ADMIN**
   - All staging candidate permissions
   - No production ingestion unless future gate

2. **CASE_MANAGER**
   - View/review candidates
   - Approve staging promotion if assigned

3. **LEGAL_REVIEWER**
   - Review candidates
   - Request redaction
   - Reject candidates

4. **DOCUMENT_OPERATOR**
   - Create staging candidates
   - View own runs

5. **VIEWER**
   - Read-only if approved

6. **PILOT_OPERATOR**
   - Limited staging candidate creation only

## Constraints
- UI visibility is not enough.
- API must enforce permission.
- Review and execution must be separate permissions.
- RAG indexing must remain separate permission/gate.
