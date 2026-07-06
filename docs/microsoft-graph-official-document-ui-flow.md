# Microsoft Graph Official Document UI Flow

**Future UI Flow (Not implemented):**

1. Open Document Sync dashboard.
2. Open “Official Document Candidate” panel.
3. Select approved parser run.
4. Preview eligible parser results.
5. Show candidate safety summary:
   - Source
   - File type
   - Parser result
   - Classification
   - Content hash
   - Extraction limits
   - Quarantine status
6. Operator creates staging candidate.
7. Legal reviewer reviews candidate.
8. Reviewer may:
   - Approve for staging promotion
   - Reject
   - Request redaction
   - Quarantine
9. Only after approval, future staging promotion may create official document workflow record.
10. No automatic case linkage.
11. No automatic RAG indexing.
12. No production action.

## Required Thai Labels:
- รายการเสนอสร้างเอกสารทางการ
- ยังไม่ใช่เอกสารทางการ
- รอผู้ตรวจสอบอนุมัติ
- ต้องตรวจชั้นความลับก่อน
- ยังไม่เชื่อมโยงคดี
- ยังไม่นำเข้า RAG
- ใช้เฉพาะ Staging
- ห้ามใช้กับเอกสารราชการจริงในขั้นตอนนี้
- อนุมัติสำหรับทดสอบใน Staging เท่านั้น
