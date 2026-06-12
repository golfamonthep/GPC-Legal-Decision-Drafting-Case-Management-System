# ทะเบียนความเสี่ยง (Risk Register)

| Risk ID | Risk Description | Likelihood | Impact | Risk Level | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|
| R01 | **Unauthorized access** (การเข้าถึงระบบโดยไม่ได้รับอนุญาต) | Low | High | High | ใช้ Microsoft Auth และ Role-based Access, ตรวจสอบ Audit log สม่ำเสมอ | Admin | Open |
| R02 | **Wrong role assignment** (กำหนดสิทธิ์ผู้ใช้ผิดบทบาท) | Medium | Medium | Medium | มีกระบวนการขออนุมัติสิทธิ์ชัดเจน | Admin | Open |
| R03 | **Import of wrong data** (นำเข้าข้อมูลผิดไฟล์/ผิดรูปแบบ) | Medium | High | High | สร้าง Validation ตอนอัปโหลด (Preview) ก่อนบันทึกจริง | Registry | Open |
| R04 | **Duplicate case data** (ข้อมูลคดีซ้ำซ้อน) | Medium | Medium | Medium | ตรวจสอบรหัสคดี (Case ID) ก่อนนำเข้า | Registry / Dev | Open |
| R05 | **AI misuse / AI Overreliance** (เชื่อผลลัพธ์ AI มากเกินไป) | Medium | High | High | แจ้งเตือนเสมอว่า *AI เป็นเครื่องมือช่วยร่างและช่วยตรวจ ไม่ใช่ผู้วินิจฉัย ต้องตรวจสอบโดยนิติกร/กรรมการทุกครั้งก่อนนำไปใช้จริง* | Legal | Open |
| R06 | **Unsupported legal citation** (ขาดการอ้างอิง) | Medium | High | High | ระบบตรวจจับข้อความและแสดงเตือนว่า *ไม่มีแหล่งอ้างอิง = ไม่ควรใช้เป็นข้อกฎหมายหรือเหตุผลวินิจฉัย* | Legal | Open |
| R07 | **DOCX formatting mismatch** (รูปแบบเอกสารผิดเพี้ยนเมื่อ Export) | High | Low | Medium | ทดสอบ Template กับหลายรูปแบบ | Dev | Open |
| R08 | **User confusion** (ผู้ใช้สับสนขั้นตอนการใช้งาน) | High | Medium | High | จัดการอบรม ทำ SOP และคู่มือ Quick Start ให้ชัดเจน | Project Team | Open |
| R09 | **Incomplete audit logging** (ไม่มีบันทึกข้อมูลการใช้งานบางส่วน) | Low | High | Medium | ทดสอบระบบ Log ในทุกจุดสำคัญก่อน Go Live | Dev | Open |
| R10 | **OneDrive/SharePoint misconfiguration** (ตั้งค่าพื้นที่จัดเก็บผิดพลาด) | Low | High | Medium | ทดสอบใน UAT ว่าไฟล์ไม่รั่วไหล | Admin / Dev | Open |
| R11 | **Production outage** (ระบบล่ม) | Low | High | High | เตรียมแผน Rollback และระบบสำรองข้อมูล | Dev | Open |
| R12 | **Data privacy concern** (ความกังวลด้านข้อมูลส่วนบุคคล) | Medium | High | High | แจ้งเตือน: *ข้อมูลสำนวนเป็นข้อมูลราชการและอาจมีข้อมูลส่วนบุคคล ห้ามคัดลอก ส่งต่อ หรืออัปโหลดออกนอกระบบโดยไม่ได้รับอนุญาต* | All | Open |
