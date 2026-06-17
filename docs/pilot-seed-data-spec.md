# Pilot Seed Data Specification

The seed data uses clearly faked/anonymized values. No real names or facts are included.

## 1. Users / Roles
| Name | Email | Role |
|------|-------|------|
| Pilot Admin | uat-admin@example.test | ADMIN |
| Pilot Registry | uat-case-manager@example.test | REGISTRY_OFFICER |
| Pilot Drafter | uat-drafter@example.test | LEGAL_OFFICER |
| Pilot Reviewer | uat-reviewer@example.test | COMMISSIONER |
| Pilot Viewer | uat-viewer@example.test | VIEWER |

## 2. Cases
- **PILOT-CASE-001**: Simple active case (ร้องทุกข์, วินัยไม่ร้ายแรง, รับเรื่อง)
- **PILOT-CASE-002**: Case with draft in progress (อุทธรณ์, วินัยร้ายแรง, อยู่ระหว่างพิจารณา/ร่างคำวินิจฉัย)
- **PILOT-CASE-003**: Case ready for review/finalization (รอเข้าประชุม)
- **PILOT-CASE-004**: Case ready for dispatch (รอดำเนินการทางธุรการ)
- **PILOT-CASE-005**: Closed/red-number case (เสร็จสิ้น, ยกอุทธรณ์)
- **PILOT-CASE-006**: Data quality issue case (รับเรื่อง, การแต่งตั้งโยกย้าย)
- **PILOT-CASE-007**: Meeting agenda case (รอเข้าประชุม)
- **PILOT-CASE-008**: RAG/library reference case (รับเรื่อง)

## 3. Drafts
- For `PILOT-CASE-002`, a draft is seeded with title `PILOT_DRAFT_1`.
- Contains fake facts text `PILOT_FACTS_TEXT`.

## 4. Meetings
- `PILOT_MEETING_1` with meetingNo `PILOT-MTG-1` in status `SCHEDULED`.

## 5. Audit Logs
- Automatically logged after seed script completes with action `PILOT_SEED_EXECUTED`.
