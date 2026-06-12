# แผนการขยายผลการใช้งานระบบ (Wider Rollout Plan)

## วัตถุประสงค์ของการขยายผล (Purpose of Wider Rollout)
เพื่อขยายการใช้งานระบบจัดการคดีและช่วยร่างคำวินิจฉัย ก.พ.ค.ตร. จากกลุ่มผู้ใช้ทดลอง (Pilot Users) ไปสู่เจ้าหน้าที่ที่เกี่ยวข้องในวงกว้างอย่างเป็นระบบ โดยมีการควบคุมความปลอดภัย มีความโปร่งใส และสามารถตรวจสอบได้ (Auditable)

## หลักการขยายผล (Rollout Principles)
- **Controlled Access Only**: การเข้าถึงระบบต้องมีการควบคุมอย่างเข้มงวด
- **Role-based Permissions**: สิทธิ์การใช้งานระบบเป็นไปตามบทบาทหน้าที่เท่านั้น
- **No Uncontrolled AI Use**: ไม่มีการใช้งาน AI โดยปราศจากการควบคุม
- **No Source = No Legal Drafting**: ไม่มีแหล่งอ้างอิง = ไม่ควรใช้เป็นข้อกฎหมายหรือเหตุผลวินิจฉัย
- **Human Legal Review is Mandatory**: AI เป็นเครื่องมือช่วยร่างและช่วยตรวจ ไม่ใช่ผู้วินิจฉัย ต้องตรวจสอบโดยนิติกร/กรรมการทุกครั้งก่อนนำไปใช้จริง
- **Auditability is Mandatory**: การดำเนินการทุกขั้นตอนในระบบต้องสามารถตรวจสอบย้อนหลังได้
- **Production Data Integrity**: ข้อมูลจริงต้องไม่ถูกแก้ไขในฐานข้อมูลโดยตรง
- **Data Confidentiality**: ข้อมูลสำนวนเป็นข้อมูลราชการและอาจมีข้อมูลส่วนบุคคล ห้ามคัดลอก ส่งต่อ หรืออัปโหลดออกนอกระบบโดยไม่ได้รับอนุญาต (ไม่มีการนำเอกสารจริงเข้า GitHub)
- **Feedback & Tracking**: ปัญหาทั้งหมดต้องได้รับการบันทึกและจัดลำดับความสำคัญ

## ขอบเขตการขยายผล (Rollout Scope)
ครอบคลุมเจ้าหน้าที่กลุ่มงานต่างๆ ได้แก่ ฝ่ายบริหารงานทั่วไป (งานสารบรรณ), กลุ่มงานคดี และคณะกรรมการ ก.พ.ค.ตร.

## นอกเหนือขอบเขต (Out-of-Scope Items)
การบูรณาการแบบเต็มรูปแบบกับระบบภายนอกที่ไม่เกี่ยวข้องกับงานคดี ก.พ.ค.ตร. หรือการพัฒนาฟีเจอร์ใหม่นอกเหนือจากแผนการขยายผลนี้

## กลุ่มผู้ใช้งานเป้าหมาย (Target User Groups)
- Administrators
- Registry Officers
- Legal Officers
- Commissioners
- Viewers / Read-only users

## ระยะการขยายผล (Rollout Phases)

### Phase 0: Pre-rollout readiness
- Security review complete
- UAT complete
- Stabilization exit criteria met
- Admin verified
- Role permissions verified
- Backup/rollback ready
- SOP/training docs ready

### Phase 1: Expanded pilot
- Small group of registry officers and legal officers
- Limited case types
- Controlled import of selected registry data
- Daily monitoring
- Feedback loop active

### Phase 2: Department-level rollout
- Additional legal officers
- Commissioners added for review access
- Wider case dataset
- DOCX export used for internal review only
- Weekly issue triage

### Phase 3: Operational use
- Routine registry updates
- Routine draft section workflow
- AI tools available under permission controls
- Audit log monitoring
- Monthly improvement cycle

### Phase 4: Integration expansion
- OneDrive/SharePoint upload/sync if approved
- Improved Microsoft Graph integration
- Advanced reporting
- Possible official document workflow integration

## เกณฑ์ความพร้อม (Readiness Gates)
- [ ] ผ่านเกณฑ์ Stabilization Exit Criteria
- [ ] การอบรมและคู่มือพร้อมใช้งาน
- [ ] แผนกู้คืนระบบ (Rollback) ชัดเจน

## การควบคุมความเสี่ยง (Risk Controls)
- ตรวจสอบ Audit Log อย่างสม่ำเสมอ
- จำกัดสิทธิ์การแก้ไขและการใช้งาน AI

## ตัวชี้วัดความสำเร็จ (Success Metrics)
พิจารณาจาก Adoption Metrics เช่น จำนวนผู้ใช้งาน จำนวนคดีที่นำเข้า และจำนวนปัญหา (Support Tickets) ที่ลดลง

## รูปแบบการสนับสนุน (Support Model)
ใช้ระบบ Support 3 ระดับ: Level 1 (User), Level 2 (Admin), Level 3 (Technical/Developer)

## แผนการถอยกลับ (Rollback Plan)
เตรียมพร้อมสำหรับการ Rollback หรือ Pause การทำงานบางส่วนหากพบปัญหารุนแรง (ดูที่ `ROLLBACK_AND_PAUSE_PLAN.md`)

## แผนการสื่อสาร (Communication Plan)
มี Template สำหรับประกาศการใช้งาน การแจ้งเตือนต่างๆ ให้กับกลุ่มผู้ใช้เป้าหมาย

## แนวทางการจัดการการเปลี่ยนแปลง (Change Management Approach)
สนับสนุนให้เจ้าหน้าที่ปรับตัวเข้ากับระบบงานใหม่ผ่านการอบรมอย่างต่อเนื่องและการติดตามประเมินผลอย่างใกล้ชิด
