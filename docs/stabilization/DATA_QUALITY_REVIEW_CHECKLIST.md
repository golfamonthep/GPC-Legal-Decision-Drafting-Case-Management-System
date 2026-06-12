# เช็คลิสต์ตรวจสอบคุณภาพข้อมูล (Data Quality Review Checklist)

ตรวจสอบรายการเหล่านี้หลังจากการนำเข้าบัญชีคุมคดี (Registry Import) เพื่อให้แน่ใจว่าข้อมูลมีความถูกต้องครบถ้วน

* [ ] ตรวจสอบคดีที่ไม่มีหมายเลขคดีดำ (missing black case number)
* [ ] ตรวจสอบคดีที่ไม่มีหมายเลขคดีแดง (missing red case number) สำหรับคดีที่เสร็จสิ้นแล้ว
* [ ] ตรวจสอบคดีที่มีหมายเลขคดีแดง แต่สถานะไม่ใช่ "แล้วเสร็จ" (red case number but status not completed)
* [ ] ตรวจสอบคดีที่มีสถานะ "แล้วเสร็จ" แต่ไม่มีหมายเลขคดีแดง (completed status but no red case number)
* [ ] ตรวจสอบคดีที่ไม่มีชื่อผู้ร้อง/ผู้อุทธรณ์ (missing petitioner/appellant)
* [ ] ตรวจสอบคดีที่ไม่มีชื่อคู่กรณี (missing counterparty)
* [ ] ตรวจสอบคดีที่ไม่มีหัวเรื่อง (missing subject)
* [ ] ตรวจสอบคดีที่ไม่มีเจ้าหน้าที่นิติกรผู้รับผิดชอบ (missing legal officer)
* [ ] ตรวจสอบคดีที่ไม่มีวันที่รับเรื่อง (missing received date)
* [ ] ตรวจสอบคดีเก่าที่ยังคงมีสถานะ Active อยู่นานผิดปกติ (old active cases)
* [ ] ตรวจสอบว่ามีหมายเลขคดีดำที่ซ้ำกันหรือไม่ (duplicate black case number)
* [ ] ตรวจสอบว่ามีหมายเลขคดีแดงที่ซ้ำกันหรือไม่ (duplicate red case number)
* [ ] ตรวจสอบความสม่ำเสมอของการใช้ถ้อยคำในสถานะคดี (inconsistent status wording)
* [ ] ตรวจสอบว่าวันที่ในรูปแบบภาษาไทยถูกแปลงค่าอย่างถูกต้อง (malformed Thai dates)
* [ ] ตรวจสอบว่าบันทึกการปฏิบัติงานหรือหมายเหตุที่ขึ้นบรรทัดใหม่ยังคงถูกเก็บรักษาไว้ครบถ้วน (multiline operation notes preserved)
