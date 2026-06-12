# Stabilization Backlog

เอกสารนี้รวบรวมรายการงานและปัญหาเพื่อจัดการในช่วง Stabilization Sprint 

## 1. ต้องแก้ไขก่อนเปิดใช้จริง (Must fix before wider rollout)

| ID | Title | Category | Severity | Priority | Affected module | Owner | Status | Target sprint | Notes |
|---|---|---|---|---|---|---|---|---|---|
| B-001 | ตรวจสอบสิทธิ์ Role ให้ครอบคลุมทุก API | Security | High | P1 | Auth | Admin | To Do | Sprint 0 | ป้องกันการเข้าถึง API โดยไม่มีสิทธิ์ |
| B-002 | แดชบอร์ดยอดคดีเกินกำหนดคำนวณผิดพลาด | Data | High | P1 | Dashboard | Dev | To Do | Sprint 1 | ต้องตรงกับรายงาน Excel เดิม |
| B-003 | การนำเข้า Excel ล้มเหลวหากมีบรรทัดว่าง | Data | High | P1 | Registry | Dev | To Do | Sprint 1 | |

## 2. ควรแก้ไขระหว่างนำร่อง (Should fix during pilot)

| ID | Title | Category | Severity | Priority | Affected module | Owner | Status | Target sprint | Notes |
|---|---|---|---|---|---|---|---|---|---|
| B-004 | แก้ไขรูปแบบวันที่ในไฟล์ DOCX | UX/UI | Medium | P2 | DOCX Export | Dev | To Do | Sprint 4 | ปรับเป็นรูปแบบวันที่ภาษาไทยทางการ |
| B-005 | เพิ่มการแจ้งเตือนเมื่อ AI ไม่พบแหล่งอ้างอิง | AI | Medium | P2 | Draft Workspace| Dev | To Do | Sprint 3 | ต้องขึ้นคำเตือนชัดเจน |

## 3. สามารถแก้ไขในภายหลังได้ (Could fix later)

| ID | Title | Category | Severity | Priority | Affected module | Owner | Status | Target sprint | Notes |
|---|---|---|---|---|---|---|---|---|---|
| B-006 | ปรับปรุงสีและเงาของปุ่มกด | UX/UI | Low | P3 | UI | Dev | Backlog | TBD | |
| B-007 | เพิ่มระบบแจ้งเตือนผ่านอีเมล | Feature | Low | P3 | Notification | Dev | Backlog | TBD | |

## 4. การปรับปรุงการฝึกอบรม/SOP (Training/SOP updates)

| ID | Title | Category | Severity | Priority | Affected module | Owner | Status | Target sprint | Notes |
|---|---|---|---|---|---|---|---|---|---|
| B-008 | เพิ่มรูปภาพประกอบการใช้งาน Draft Workspace | Training | Medium | P2 | Docs | Admin | To Do | Sprint 4 | |

## 5. ประเด็นที่รอการตัดสินใจ (Decisions needed)

| ID | Title | Category | Severity | Priority | Affected module | Owner | Status | Target sprint | Notes |
|---|---|---|---|---|---|---|---|---|---|
| B-009 | กำหนดระยะเวลาการเก็บ Audit Log ล่วงหน้า | Policy | High | P1 | Audit | Admin | In Progress | Sprint 2 | รอข้อสรุปจากทีมบริหาร |
