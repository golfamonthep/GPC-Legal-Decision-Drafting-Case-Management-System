# DOCX/PDF Expansion Policy

1. **Environment Constraint:** Staging only.
2. **Data Constraint:** Fake test files only.
3. **Allowed File Types:** `.docx` and `.pdf` only.
4. **OCR Policy:** No scanned PDF/OCR.
5. **Security Policy (PDF):** No encrypted/password-protected PDF.
6. **Security Policy (Office):** No macro-enabled Office files.
7. **Embedded Objects:** No embedded file extraction.
8. **Media Policy:** No image extraction.
9. **Metadata Policy (Office):** No comments/track changes extraction until separately approved.
10. **Data Privacy Policy:** No metadata containing real personal data.
11. **Production Constraint:** No official case files.
12. **Environment Constraint:** No production ingestion.
13. **Data Integrity Constraint:** No official Document record creation.
14. **System Constraint:** No RAG indexing.
15. **UI Policy:** Preview must be limited.
16. **UI Policy:** Full extracted content must not be shown in UI.
17. **Logging Policy:** Content must not be logged.
18. **Error Policy:** All parser errors must fail safe.
19. **Quarantine Policy:** Unsupported/failed files must be quarantined.
20. **Mutation Policy:** Quarantine must not modify Microsoft 365 files.
