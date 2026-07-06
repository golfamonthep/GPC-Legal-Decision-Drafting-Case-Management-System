# Pilot Acceptance Criteria

## 1. Authentication
- **Requirement**: Users must log in via Entra ID.
- **Pass Condition**: Successful login redirects to Dashboard based on role.
- **Fail Condition**: Unauthorized users gain access, or login fails for authorized users.
- **Evidence**: Login logs / Test video.
- **Owner**: System Operator.
- **Priority**: Critical.

## 2. Role Permission
- **Requirement**: RBAC must restrict access.
- **Pass Condition**: Viewers cannot edit cases; Legal Officers cannot change global admin settings.
- **Fail Condition**: Privilege escalation is possible.
- **Evidence**: Audit logs showing denied actions.
- **Owner**: Admin.
- **Priority**: Critical.

## 3. Dashboard
- **Requirement**: Metrics accurately reflect Staging DB state.
- **Pass Condition**: Totals match DB counts exactly.
- **Fail Condition**: Mismatch between Dashboard and Case List totals.
- **Evidence**: Screenshot comparison.
- **Owner**: Pilot Coordinator.
- **Priority**: Medium.

## 4. Registry Import
- **Requirement**: Excel uploads parse correctly.
- **Pass Condition**: Cases are created; duplicates are caught or updated correctly.
- **Fail Condition**: System crashes on import; data is scrambled.
- **Evidence**: Import success log.
- **Owner**: Registry Officer.
- **Priority**: High.

## 5. Case List
- **Requirement**: Display and filter cases.
- **Pass Condition**: Search and filter by status/officer work.
- **Fail Condition**: List fails to load or pagination breaks.
- **Evidence**: UI Test.
- **Owner**: Pilot Coordinator.
- **Priority**: Medium.

## 6. Case Detail
- **Requirement**: Display full case info.
- **Pass Condition**: All imported fields are visible.
- **Fail Condition**: Missing data that exists in DB.
- **Evidence**: UI Test.
- **Owner**: Legal Officer.
- **Priority**: High.

## 7. Completed/Overdue Logic
- **Requirement**: Correctly classify overdue cases.
- **Pass Condition**: Cases with "เสร็จสิ้น", "เสร็จสิ้น (ศาลปกครอง)", "เลขแดง", or "แดงแล้ว" are NOT overdue, regardless of SLA dates.
- **Fail Condition**: Completed cases show as overdue.
- **Evidence**: Dashboard/Case List screenshots.
- **Owner**: System Operator.
- **Priority**: High.

## 8. Legal Officer Display
- **Requirement**: Officers see assigned cases.
- **Pass Condition**: Filtering by assigned user works.
- **Fail Condition**: Assignment mapping fails.
- **Evidence**: UI Test.
- **Owner**: Pilot Coordinator.
- **Priority**: Medium.

## 9. Case Event/History
- **Requirement**: Status changes are recorded.
- **Pass Condition**: History tab shows chronologically accurate logs.
- **Fail Condition**: History is blank or inaccurate.
- **Evidence**: DB record check.
- **Owner**: Admin.
- **Priority**: Medium.

## 10. Knowledge Library
- **Requirement**: Users can view uploaded docs.
- **Pass Condition**: Document list is accessible.
- **Fail Condition**: Documents fail to load.
- **Evidence**: UI Test.
- **Owner**: Legal Officer.
- **Priority**: Medium.

## 11. Legal Q&A / RAG
- **Requirement**: RAG provides cited answers.
- **Pass Condition**: Answers include valid citations to uploaded docs. Refuses to answer if no docs match.
- **Fail Condition**: Hallucinates sources or crashes on query.
- **Evidence**: Query logs.
- **Owner**: Legal Officer.
- **Priority**: Critical.

## 12. DOCX/Template Workflow
- **Requirement**: Generate DOCX files from case data.
- **Pass Condition**: Downloaded DOCX is valid and contains case data.
- **Fail Condition**: Download fails, or file is corrupted.
- **Evidence**: Downloaded test file.
- **Owner**: Legal Officer.
- **Priority**: High.

## 13. Audit Log
- **Requirement**: Actions are logged securely.
- **Pass Condition**: DB contains audit records for case updates.
- **Fail Condition**: Actions bypass audit logging.
- **Evidence**: DB Query.
- **Owner**: Admin.
- **Priority**: High.

## 14. Error Handling
- **Requirement**: System fails gracefully.
- **Pass Condition**: User sees friendly error message; no stack traces leaked.
- **Fail Condition**: White screen of death; stack trace visible.
- **Evidence**: Manual error trigger test.
- **Owner**: System Operator.
- **Priority**: Medium.

## 15. Performance
- **Requirement**: Reasonable load times.
- **Pass Condition**: Pages load in < 3s; RAG answers in < 15s.
- **Fail Condition**: Vercel timeouts (504 errors).
- **Evidence**: Network tab monitoring.
- **Owner**: System Operator.
- **Priority**: High.

## 16. Data Accuracy
- **Requirement**: Zero corruption of imported data.
- **Pass Condition**: DB matches Excel source perfectly.
- **Fail Condition**: Character encoding issues; swapped fields.
- **Evidence**: Spot check comparison.
- **Owner**: Registry Officer.
- **Priority**: Critical.

## 17. Security
- **Requirement**: No production data in staging.
- **Pass Condition**: DB only contains synthetic/sanitized pilot cases.
- **Fail Condition**: Live sensitive data found in Pilot DB.
- **Evidence**: DB review.
- **Owner**: Admin.
- **Priority**: Critical.

## 18. User Satisfaction
- **Requirement**: Users can complete workflows.
- **Pass Condition**: Pilot users complete 1 test case end-to-end.
- **Fail Condition**: UX is too confusing to proceed.
- **Evidence**: User feedback form.
- **Owner**: Pilot Coordinator.
- **Priority**: Medium.

## 19. Operational Readiness
- **Requirement**: Support process is in place.
- **Pass Condition**: Issue reporting workflow is tested and working.
- **Fail Condition**: Users don't know how to report errors.
- **Evidence**: Trial issue report submitted.
- **Owner**: Pilot Coordinator.
- **Priority**: High.
