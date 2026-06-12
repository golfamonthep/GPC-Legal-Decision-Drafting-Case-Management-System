# บันทึกการตัดสินใจขยายผลการใช้งาน (Wider Rollout Go/No-Go Decision)

| หัวข้อ | รายละเอียด |
|---|---|
| **Date** (วันที่ประเมิน) | `[YYYY-MM-DD]` |
| **Rollout Phase** (ระยะการขยายผล) | `[Phase 1 / 2 / 3 / 4]` |
| **Approver** (ผู้อนุมัติ) | `[Name / Title]` |

## การตัดสินใจ (Decision)
- [ ] **GO** (พร้อมดำเนินการขยายผลเต็มรูปแบบ)
- [ ] **NO-GO** (ยังไม่พร้อม ต้องแก้ไขข้อบกพร่องที่พบ)
- [ ] **CONDITIONAL GO** (ขยายผลแบบมีเงื่อนไข)

## เกณฑ์การพิจารณา (Evaluation Criteria)
| หมวดหมู่ | สถานะ | หมายเหตุ |
|---|---|---|
| Open P0 issues (ปัญหาบล็อกเกอร์) | `[Number / None]` | ... |
| Open P1 issues (ปัญหาร้ายแรง) | `[Number / None]` | ... |
| Security checklist status (ความปลอดภัย) | `[Pass / Fail]` | ... |
| UAT status (ผลทดสอบระบบ) | `[Pass / Fail]` | ... |
| Training status (การอบรม) | `[Complete / Incomplete]` | ... |
| Rollback readiness (ความพร้อมแผนสำรอง) | `[Ready / Not Ready]` | ... |

## เหตุผลประกอบการตัดสินใจ (Decision Rationale)
`[ระบุเหตุผลในการตัดสินใจ เช่น ระบบทำงานได้เสถียรตามเกณฑ์ ไม่พบปัญหาความปลอดภัย ผู้ใช้งานเข้าใจการทำงานดีแล้ว]`

## เงื่อนไขในกรณี Conditional Go (Conditions if conditional go)
- `[ตัวอย่าง: อนุมัติให้ใช้งานเฉพาะในส่วนของงานสารบรรณก่อน จนกว่าฟังก์ชันแก้ไขเอกสารจะสมบูรณ์ 100%]`
