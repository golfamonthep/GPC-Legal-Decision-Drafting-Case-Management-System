# เช็คลิสต์ตรวจสอบความถดถอยด้านการส่งออกเอกสาร (DOCX Export Regression Checklist)

ดำเนินการทดสอบการสร้างไฟล์คำวินิจฉัย

* [ ] สามารถดาวน์โหลดไฟล์สำเร็จ (download works)
* [ ] รองรับการตั้งชื่อไฟล์เป็นภาษาไทย (Thai filename works)
* [ ] ไม่มี Placeholder (เช่น {{text}}) หลงเหลืออยู่ในไฟล์ที่ได้ (no raw placeholders)
* [ ] ไม่มีเนื้อหาแปลกปลอมที่เกิดจากระบบแต่งขึ้นเอง (no invented content)
* [ ] ไม่มีข้อมูลเมตาดาต้าภายในของ AI ปะปน (no internal AI metadata)
* [ ] ส่วนบล็อกหมายเลขคดี (คดีดำ/แดง) แสดงผลถูกต้อง (case number block correct)
* [ ] ฉลากระบุฝ่าย (ผู้ร้อง/ผู้อุทธรณ์) ถูกต้องตามประเภทคดี (party labels correct for grievance/appeal)
* [ ] ลำดับหัวข้อต่างๆ ในเอกสารถูกต้องตามเทมเพลต (section order correct)
* [ ] ระยะห่างระหว่างย่อหน้าเหมาะสม (paragraph spacing acceptable)
* [ ] บล็อกลายเซ็นครบถ้วน (signature block acceptable)
* [ ] กรณีไม่มีไฟล์เทมเพลต ระบบจะใช้ Fallback ได้และเอกสารยังอ่านได้ (template missing fallback works)
* [ ] การดาวน์โหลดไฟล์มีการสร้างบันทึก AuditLog (AuditLog created)
