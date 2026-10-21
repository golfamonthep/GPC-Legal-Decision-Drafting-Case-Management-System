# การอัปเดตบัญชีอาวุโส 9 ต.ค. 2569

อัปเดต 9 ต.ค. 2569: ตรวจภาพและเทียบชื่อผู้เลื่อนระดับ 181/184 ราย เปลี่ยนลำดับจาก workbook 66 ราย อีก 3 รายอยู่นอกระดับที่ PDF ครอบคลุม แยกจำนวนผู้เหมาะสมและหน้าอ้างอิงครบสำหรับ 181 ราย ยังไม่มี source ตำแหน่งว่างจริง จึงไม่คำนวณโควตาหรือกลุ่มผู้ได้รับเลื่อน

ข้อจำกัด: รายการแต่งตั้ง 281 รายและตำแหน่งเดิม/ใหม่สืบทอดจากฐานเดิมที่มี PDF hash ตรงกัน ไม่ได้ยืนยันภาพแต่งตั้งซ้ำทั้งหมด รายชื่ออาวุโสทั้งหมดไม่ได้ถอดใหม่ ข้อมูลที่ตรวจได้มีชื่อผู้ได้รับเลื่อน 181 รายและจำนวนในบัญชีต้นทางที่เกี่ยวข้อง ไม่ผสมแหล่งรุ่นเก่า

สำรองฐานก่อนอัปเดตไว้ใน archive/before-seniority-update-2026-10-09 และ SQLite สำรองแยกไฟล์ ต้นฉบับใน Downloads และ OneDrive ไม่เปลี่ยน

## ผลตรวจชุดปัจจุบัน

```json
{
  "sheets": [
    "สรุป",
    "การแต่งตั้งนายพลวาระ 2569"
  ],
  "appointments": 281,
  "promotions": 184,
  "verified_seniority_matches": 181,
  "source_scope_gaps": 3,
  "changed_orders": 66,
  "unchanged_name_position_destination_cells": "PASS",
  "original_summary_counts_and_rules": "PASS",
  "unsupported_vacancies_and_quotas_blank": "PASS",
  "source_document_hashes": "PASS",
  "source_documents": 7
}
```
