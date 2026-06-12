# แผนสปรินต์ช่วงสร้างความเสถียร (Stabilization Sprint Plan)

## วัตถุประสงค์ (Purpose of Stabilization Phase)
ช่วงสร้างความเสถียร (Stabilization Phase) มีขึ้นเพื่อรวบรวมและแก้ไขปัญหาที่พบจากการทดสอบของกลุ่มผู้ใช้งานนำร่อง (Pilot Feedback), ข้อค้นพบจาก UAT, ประเด็นด้านความปลอดภัย และปัญหาจากการปฏิบัติงานจริง โดยมุ่งเน้นการทำระบบให้พร้อมและมีความเสถียรสูงสุดก่อนการเปิดใช้งานเต็มรูปแบบ (Wider Rollout)

## เป้าหมายของช่วงสร้างความเสถียร (Stabilization Phase Goals)
* ป้องกันข้อมูลสูญหาย (Prevent data loss)
* ป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต (Prevent unauthorized access)
* ทำให้การนำเข้าบัญชีคุมคดีมีความน่าเชื่อถือ (Ensure registry import reliability)
* ทำให้ข้อมูลสรุปในแดชบอร์ดถูกต้องแม่นยำ (Ensure dashboard accuracy)
* ทำให้การทำงานร่างและส่งออก DOCX มีความน่าเชื่อถือ (Ensure draft/DOCX workflow reliability)
* ทำให้เครื่องมือ AI ยึดโยงกับแหล่งอ้างอิงเสมอ (Ensure AI tools remain source-grounded)
* ทำให้ระบบบันทึกประวัติการใช้งานมีประโยชน์และครบถ้วน (Ensure audit logs are useful)
* ทำให้แน่ใจว่าผู้ใช้งานเข้าใจมาตรฐานการปฏิบัติงาน (Ensure users understand SOP)
* ลดปัญหาคอขวดหรือจุดติดขัดในประสบการณ์ใช้งานก่อนเปิดใช้จริง (Reduce high-friction UX points before wider rollout)

## ขอบเขตการทำงาน (Stabilization Scope)
โฟกัสที่การซ่อมบั๊ก, ปรับปรุงประสิทธิภาพ, และเสริมความปลอดภัยตามผลตอบรับของ Pilot ห้ามเพิ่มฟีเจอร์ใหม่ที่อยู่นอกเหนือเป้าหมายหลักในการทำให้ระบบเสถียร

### สิ่งที่ต้องแก้ไขก่อน Wider Rollout (Must Fix)
* ช่องโหว่ด้านความปลอดภัยและสิทธิ์การเข้าถึง (P0/P1 Security)
* ข้อผิดพลาดที่ทำให้ข้อมูลคดีผิดเพี้ยนหรือสูญหาย
* ปัญหาที่บล็อกกระบวนการหลัก (Registry Import, DOCX Export)

### สิ่งที่รอได้ (Can Wait)
* การปรับปรุงความสวยงามของ UI (Visual polish)
* ฟีเจอร์ AI ขั้นสูง หรือการเชื่อมต่อระบบใหม่ๆ (Advanced integrations)
* การปรับปรุงความสะดวกที่ไม่ได้ขัดขวางการทำงานหลัก

## กรอบเวลาการทำงาน (Sprint Cadence)
ใช้รอบการทำงาน (Sprint) สั้น ๆ ตามแผนต่อไปนี้:

* **Sprint 0: Emergency hardening (1-3 วัน)** - โฟกัส: P0/P1 ด้านความปลอดภัยและข้อมูลเท่านั้น
* **Sprint 1: Registry and dashboard reliability** - โฟกัส: การตรวจสอบความถูกต้องนำเข้าข้อมูล, การจัดการข้อมูลซ้ำ, ความเสถียรของธุรกรรม, ยอดรวมในแดชบอร์ด, ตรรกะงานเกินกำหนด, การปรับมาตรฐานสถานะคดี
* **Sprint 2: Case workflow and audit reliability** - โฟกัส: การแก้ไขรายละเอียดคดี, ความครบถ้วนของ CaseEvent และ AuditLog, พฤติกรรมของสิทธิ์การเข้าถึง, เมตาดาต้าของลิงก์เอกสาร
* **Sprint 3: Drafting, AI review, and citation safety** - โฟกัส: การทำงานของส่วนร่างคำวินิจฉัย, การตรวจสอบแหล่งที่มาของ AI, พฤติกรรมของตัวตรวจสอบถ้อยคำและตัวตรวจสอบแหล่งอ้างอิง, คำเตือนให้มนุษย์ทบทวน
* **Sprint 4: DOCX export and staff usability** - โฟกัส: รูปแบบไฟล์ Word, การจับคู่เทมเพลต, การตั้งชื่อไฟล์, ผลตอบรับจากการฝึกอบรม, ความชัดเจนของ SOP
* **Sprint 5: Go-live readiness** - โฟกัส: UAT รอบสุดท้าย, การทดสอบตามสิทธิ์, เช็คลิสต์ความปลอดภัย, แผนการสำรอง/ย้อนกลับข้อมูล, ความพร้อมของแอดมิน

## เกณฑ์การจัดลำดับความสำคัญของปัญหา (Issue Priority Framework)

**P0 Immediate (ต้องแก้ไขทันที):**
* ข้อมูลรั่วไหล (data leak)
* การเข้าถึงโดยไม่ได้รับอนุญาต (unauthorized access)
* ข้อมูลเสียหาย (data corruption)
* ระบบใน Production ล่ม (production outage)
* ระบบนำเสนอข้อสรุปทางกฎหมายที่ผิดพลาด (wrong legal conclusion inserted by system)
* AI แต่งข้อมูลขึ้นเองและแสดงเสมือนเป็นข้อเท็จจริง (AI invents source and UI presents it as authority)

**P1 This week (ต้องแก้ไขในสัปดาห์นี้):**
* ไม่สามารถนำเข้าข้อมูลบัญชีคุมคดีได้ (registry import blocked)
* ไม่สามารถส่งออกไฟล์ DOCX ได้ (DOCX export broken)
* ไม่สามารถแก้ไขคดีได้ (case edit broken)
* ข้อมูลในแดชบอร์ดผิดพลาดอย่างมีนัยสำคัญ (dashboard materially wrong)
* สิทธิ์การใช้งานทำงานผิดพลาด (role permission behavior wrong)
* ไม่มีการบันทึก Audit log ในการกระทำที่สำคัญ (audit logging missing for critical action)

**P2 Next sprint (ต้องแก้ไขในสปรินต์ถัดไป):**
* UI สร้างความสับสนและทำให้เกิดข้อผิดพลาดซ้ำๆ (confusing UI causing repeated user errors)
* ปัญหาการจัดรูปแบบไฟล์ DOCX ที่ไม่วิกฤต (non-critical DOCX layout issue)
* ระบบทำงานช้าแต่มีวิธีเลี่ยงเพื่อทำงานต่อได้ (slow workflow with workaround)
* ขาดตัวกรองหรือการค้นหาที่เป็นประโยชน์ (missing helpful filter/search)
* ช่องโหว่ในการฝึกอบรม/SOP (training/SOP gap)

**P3 Backlog (เก็บไว้พิจารณาในภายหลัง):**
* การปรับปรุงเพื่อให้ใช้งานได้ดีขึ้นแต่ไม่จำเป็น (nice-to-have improvements)
* การตกแต่งหน้าตาของระบบ (visual polish)
* ระบบอัตโนมัติในอนาคต (future automation)
* การเชื่อมต่อระบบขั้นสูง (advanced integrations)

## กระบวนการคัดกรองปัญหา (Triage Process)
1. รวบรวมปัญหาจากผู้ใช้งานนำร่องและตรวจสอบตาม Pilot Issue Log
2. จัดลำดับความสำคัญ (P0-P3)
3. หากเป็น P0 ให้หยุดงานปัจจุบันและเข้าแก้ไขทันที
4. หากเป็นระดับอื่น ให้นำเข้า Backlog เพื่อจัดสรรใน Sprint ถัดไป

## เกณฑ์การปล่อยอัปเดต (Release Criteria)
* ไม่มีปัญหา P0 ตกค้าง
* ไม่มีปัญหา P1 ด้านความปลอดภัยและข้อมูลตกค้าง
* ผ่านการทดสอบ Regression ทั้งหมดที่ระบุในเช็คลิสต์

## เกณฑ์การย้อนกลับระบบ (Rollback Criteria)
* หากพบ P0 หลังจากปล่อยอัปเดต ให้พิจารณาย้อนกลับไปใช้เวอร์ชันก่อนหน้า (Rollback) ทันที
* หากมีปัญหาเกี่ยวกับการสูญหายของข้อมูล ให้เตรียมการ Restore ข้อมูลตามแผนใน Operations Runbook

## บทบาทและความรับผิดชอบ (Roles and Responsibilities)
* **ผู้จัดการระบบ (System Admin):** จัดการความปลอดภัย, อัปเดต, กู้คืนระบบ และตั้งค่า
* **นักพัฒนา (Developers):** แก้ไขปัญหา, จัดลำดับความสำคัญตามแผน
* **ผู้ใช้งานนำร่อง (Pilot Users):** รายงานปัญหาตามแบบฟอร์ม
* **ผู้ตรวจสอบ (QA/Security):** ตรวจสอบการผ่านเกณฑ์

## จังหวะการรายงานผล (Reporting Rhythm)
* ตรวจสอบปัญหาใหม่ทุกวัน (Daily Triage)
* ทบทวนสรุป Sprint และประเมินเพื่อปล่อยอัปเดตทุกสิ้นสัปดาห์ (Weekly Sprint Review)
