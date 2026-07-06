# Microsoft Graph DOCX/PDF Future UI Flow

*This document outlines the UI flow for the future DOCX/PDF extraction prototype.*

## Flow
1. Open Document Sync.
2. Confirm staging-only mode.
3. Confirm existing `.txt`/`.md` trial passed.
4. Open file-type expansion panel.
5. Confirm `.docx` / `.pdf` test only.
6. Run preview.
7. See allowed/blocked candidates.
8. Enter reason.
9. Select classification:
   - `PUBLIC_TEST` or `INTERNAL_TEST` only.
10. Enter confirmation phrase:
    - `STAGING_DOCX_PDF_TEST_ONLY`
11. Run future prototype.
12. Review limited preview.
13. Review quarantine.
14. Confirm:
    - no official Document record
    - no RAG indexing
    - no production
    - no Microsoft 365 writeback

## Thai Labels
- “ขยายชนิดไฟล์ทดลอง” (Expand test file types)
- “รองรับเฉพาะ DOCX/PDF ทดสอบ” (Supports only DOCX/PDF tests)
- “ยังไม่รองรับไฟล์สแกน OCR” (Scanned OCR files not yet supported)
- “ยังไม่สร้างเอกสารในระบบ” (Official documents not yet created)
- “ยังไม่นำเข้า RAG” (RAG ingestion not yet implemented)
- “ใช้ใน Staging เท่านั้น” (For use in Staging only)
- “ไฟล์ราชการจริงห้ามใช้ในขั้นตอนนี้” (Real official files are prohibited in this step)
