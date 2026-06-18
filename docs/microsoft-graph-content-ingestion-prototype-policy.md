# Microsoft Graph Content Ingestion Prototype Policy

## Status
**BLOCKED**

## Policy Decision
Execution of the Microsoft Graph Content Ingestion Staging Prototype is blocked pending the missing Prompt 67 Design Gate. 

When unblocked, the following policy will apply to the prototype:
1. **Staging only**: Execution in production is strictly blocked.
2. **Fake test files only**: Must not use real legal or case documents.
3. **Allowed file types**: .txt and .md only in the first prototype.
4. **Max file size**: Recommended 100 KB for prototype.
5. **Max extracted preview stored**: Recommended 2,000 characters or lower.
6. **Content hash**: Must store content hash instead of full raw content.
7. **No raw content storage**: Do not store full raw content unless explicitly justified and owner-approved.
8. **No UI display**: Do not display full content in UI.
9. **No logging**: Do not log document content.
10. **No RAG**: Do not RAG index.
11. **No official Documents**: Do not create official Document records.
12. **No real cases**: Do not link to real cases.
13. **Unsupported files**: Must be blocked or quarantined.
14. **Unknown sensitivity**: Blocks ingestion.
15. **Production Block**: Production remains entirely blocked.
16. **No Delete/Purge**: Delete and purge actions are strictly prohibited.
