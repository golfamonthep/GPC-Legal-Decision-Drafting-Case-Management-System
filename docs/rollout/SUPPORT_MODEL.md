# รูปแบบการสนับสนุนผู้ใช้งาน (Support Model)

## ระดับการสนับสนุน (Support Levels)

### Level 1: User support
- Login help (ช่วยเหลือการเข้าสู่ระบบ)
- Navigation help (ช่วยเหลือการใช้งานเมนูต่างๆ)
- SOP clarification (อธิบายคู่มือปฏิบัติงาน)
- Training questions (ตอบคำถามหลังการอบรม)

### Level 2: System admin
- Role assignment (จัดการสิทธิ์การใช้งาน)
- Import monitoring (ติดตามและแก้ไขปัญหาการนำเข้าข้อมูล)
- Audit log review (ตรวจสอบ Audit Log หากมีข้อสงสัย)
- User activation/disable (เปิด/ปิดบัญชีผู้ใช้)

### Level 3: Technical/developer support
- Deployment issue (ปัญหาระบบเซิร์ฟเวอร์)
- Database issue (ปัญหาฐานข้อมูล)
- Integration issue (ปัญหาการเชื่อมต่อระบบอื่น)
- Bug fix (แก้ไขข้อผิดพลาดในโค้ด)

### Emergency
- Data leak (ข้อมูลรั่วไหล)
- Unauthorized access (การเข้าถึงโดยไม่ได้รับอนุญาต)
- Data corruption (ข้อมูลเสียหาย)
- Production outage (ระบบล่ม)

## กระบวนการรับเรื่อง (Issue Intake Process)
- รับเรื่องผ่านช่องทางที่กำหนด (เช่น IT Helpdesk, LINE Official หรือ Email)
- ระบุรายละเอียด ปัญหา และหน้าจอที่พบ

## เกณฑ์การยกระดับปัญหา (Escalation Criteria)
- หาก Level 1 แก้ปัญหาไม่ได้ใน 1 ชั่วโมง ให้ส่งต่อ Level 2
- หาก Level 2 พบว่าเป็น Bug ของระบบ ให้ส่งต่อ Level 3

## เป้าหมายระยะเวลาตอบสนอง (Response Time Targets)
- **S0/Emergency**: ภายใน 15 นาที
- **S1/Critical**: ภายใน 1 ชั่วโมง
- **S2/High**: ภายใน 4 ชั่วโมง
- **S3/Medium**: ภายใน 24 ชั่วโมง
- **S4/Low**: ตามรอบอัปเดตระบบ

## คำจำกัดความความรุนแรง (Severity Definitions)
- S0: ระบบล่ม ข้อมูลรั่วไหล หรือข้อมูลสูญหาย (Production outage / Data leak)
- S1: ไม่สามารถทำงานหลักได้ (เช่น นำเข้าข้อมูลไม่ได้ทั้งหมด)
- S2: ฟังก์ชันบางส่วนใช้ไม่ได้ แต่มีทางเลี่ยง (Workaround)
- S3: ปัญหาการแสดงผลเล็กน้อย
- S4: ข้อเสนอแนะเพื่อการพัฒนา

## ผู้รับผิดชอบ (Owner Roles)
- Level 1: ทีมประสานงานโครงการ
- Level 2: เจ้าหน้าที่ IT ผู้ดูแลระบบ
- Level 3: ทีมพัฒนาระบบ

## คำแนะนำเพิ่มเติม
- **How to collect screenshots safely**: ปิดบังข้อมูลส่วนบุคคลหรือรายละเอียดคดีที่สำคัญก่อนส่งภาพหน้าจอ (Redact sensitive information).
- **How to report suspected data leak**: แจ้ง S0 ทันทีผ่านช่องทางโทรศัพท์ถึงทีมผู้ดูแลระบบ
- **How to report wrong import**: แคปภาพหน้าจอและระบุบรรทัดในไฟล์ Excel เพื่อตรวจสอบ ส่งให้ Level 2
- **How to report AI output problem**: ระบุข้อความที่ผิดพลาดหรือไม่ได้อ้างอิงให้ชัดเจน
  - > *AI เป็นเครื่องมือช่วยร่างและช่วยตรวจ ไม่ใช่ผู้วินิจฉัย ต้องตรวจสอบโดยนิติกร/กรรมการทุกครั้งก่อนนำไปใช้จริง*
- **How to report DOCX export issue**: ระบุหัวข้อที่รูปแบบเพี้ยนหรือข้อมูลขาดหาย
- **How to report permission problem**: ระบุ User Email และบทบาทที่ควรได้รับ แจ้ง Level 2
