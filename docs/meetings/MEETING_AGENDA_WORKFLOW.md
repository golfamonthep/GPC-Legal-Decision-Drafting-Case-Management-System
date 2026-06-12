# Meeting Agenda and Board Review Workflow

## Purpose
This document outlines the workflow and operational guidelines for scheduling, reviewing, and recording decisions during the ก.พ.ค.ตร. board meetings. The system provides tools to check case readiness, manage agendas, and record meeting outcomes while strictly requiring human verification for final conclusions.

## Roles and Permissions
- **ADMIN**: Full access to manage all meeting settings.
- **COMMISSIONER**: Can view meetings, review agendas, and export documents.
- **LEGAL_OFFICER**: Can view meetings, add cases they are responsible for, and record results for their cases.
- **REGISTRY_OFFICER**: Can create meetings, add/remove cases to/from agendas, and manage meeting metadata.

## 1. Creating a Meeting
Registry officers navigate to "วาระประชุม" > "สร้างการประชุมใหม่" to schedule a meeting. They provide details such as the meeting number, date, time, location, chair, and secretary.

## 2. Adding Cases to the Agenda
Authorized users can search for cases and add them to an upcoming meeting. 
- The system prevents adding a case that is already in the same meeting.
- The readiness checker will automatically scan the case details and the decision draft to ensure all critical components (e.g., facts, reasoning, conclusions) are present.

## 3. Pre-Meeting Readiness Check
Once added, the system displays the readiness status (`พร้อมเข้าวาระ`, `ต้องปรับแก้`, or `รอตรวจความพร้อม`).
- If a case is missing information (like the petitioner's name or draft sections), the system flags it.
- Legal officers must resolve these flags in the draft workspace before the agenda is locked.

## 4. Board Review and Recording Results
During or after the meeting, authorized users can record the board's decision (e.g., "เห็นชอบตามร่าง", "ให้แก้ไขร่าง", "เลื่อนพิจารณา").
- **IMPORTANT**: Recording the result does *not* automatically change the case's final status or issue a red case number.
- Users must explicitly check confirmation boxes to apply status updates or red case numbers.

## 5. Post-Meeting Follow-up
The system tracks "Post-Meeting Actions" assigned during the meeting. These actions are visible on the Case Detail page under the "ประวัติการพิจารณา" (Meeting History) tab, ensuring follow-ups are not lost.

## 6. Audit Behavior
All actions including creating meetings, adding/removing cases, and recording results generate an `AuditLog` and a `CaseEvent` to ensure full traceability and accountability.

## What Must Not Be Automated
- **Final Decision Approval**: The system will not automatically approve or finalize a decision based on readiness scores.
- **Red Case Number Generation**: The system requires explicit human input and confirmation to record a red case number following a meeting.
- **Meeting Minutes**: While the system exports a draft outline, the official minutes must be finalized by human secretaries.
