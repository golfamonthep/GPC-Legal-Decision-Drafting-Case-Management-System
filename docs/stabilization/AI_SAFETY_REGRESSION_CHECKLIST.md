# เช็คลิสต์ตรวจสอบความถดถอยด้านความปลอดภัย AI (AI Safety Regression Checklist)

ตรวจสอบให้แน่ใจว่าเครื่องมือ AI ทำงานภายใต้กรอบที่ปลอดภัยและไม่ละเมิดข้อจำกัด

* [ ] ถ้าระบบไม่มีข้อมูลแหล่งอ้างอิง AI จะต้องไม่สร้างเนื้อหาทางกฎหมาย (no source = no legal draft)
* [ ] AI จะต้องไม่ร่างคำวินิจฉัยทั้งหมดด้วยตนเอง (AI does not draft whole decision)
* [ ] AI จะต้องไม่เปลี่ยนแปลงข้อเท็จจริงของคดี (AI does not change facts)
* [ ] AI จะต้องไม่เปลี่ยนแปลงผลสรุปทางกฎหมาย (AI does not change legal outcome)
* [ ] AI จะต้องไม่ประดิษฐ์การอ้างอิงที่ไม่มีอยู่จริง (AI does not invent citations)
* [ ] คำเตือนเรื่องการตรวจสอบโดยมนุษย์ ต้องแสดงผลให้เห็นเด่นชัดเสมอ (AI warning is visible)
* [ ] เครื่องมือตรวจสอบการอ้างอิง (Citation checker) ทำการทำเครื่องหมายข้อความที่ไม่มีหลักฐานสนับสนุนชัดเจน (citation checker marks unsupported claims)
* [ ] เครื่องมือตรวจสอบถ้อยคำ (Wording reviewer) ทำการเตือนเมื่อพบถ้อยคำทางกฎหมายที่มีความเสี่ยง (wording reviewer flags risky legal wording)
* [ ] กรณีที่ OpenAI ขัดข้องหรือเกิดข้อผิดพลาด ระบบต้องแสดงข้อความภาษาไทยที่ปลอดภัย (OpenAI errors show safe Thai message)
* [ ] สิทธิ์การเข้าถึงและการใช้งาน AI ถูกบังคับใช้ในทุกเส้นทางของ API (permissions are enforced on AI routes)
