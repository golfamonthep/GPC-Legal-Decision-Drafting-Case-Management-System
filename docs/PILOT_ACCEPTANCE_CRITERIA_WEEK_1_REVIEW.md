# Pilot Acceptance Criteria Week 1 Review

## 1. Authentication
- **Status**: Pass
- **Evidence**: Verified working correctly in staging environment with Entra ID. (PRE-6 is an isolated issue in preview environments).
- **Remaining Risk**: Low.
- **Required Action**: None for production/staging.
- **Blocks Wider Pilot**: No.

## 2. Role Permission
- **Status**: Pass
- **Evidence**: Verified RBAC enforces correct privileges. Viewers cannot mutate data.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 3. Dashboard
- **Status**: Pass
- **Evidence**: Dashboard logic accurately reads from DB and excludes 'เสร็จสิ้น' cases from active counts.
- **Remaining Risk**: Low. Users might misinterpret aggregated statuses.
- **Required Action**: Updated SOPs to clarify dashboard metrics.
- **Blocks Wider Pilot**: No.

## 4. Registry Import
- **Status**: Pass
- **Evidence**: Data maps successfully; Buddhist year and Thai dates parse correctly; Red Case Numbers map to 'เสร็จสิ้น'.
- **Remaining Risk**: Low.
- **Required Action**: SOP updated to prevent manual reversion of completed statuses without valid reason.
- **Blocks Wider Pilot**: No.

## 5. Case List
- **Status**: Pass
- **Evidence**: Filtering by status works.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 6. Case Detail
- **Status**: Pass
- **Evidence**: Core case fields visible and accurate.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 7. Completed/Overdue Logic
- **Status**: Pass
- **Evidence**: Implemented safely in code (`isClosedOrRedCase` and the import route).
- **Remaining Risk**: Low.
- **Required Action**: SOP updated.
- **Blocks Wider Pilot**: No.

## 8. Legal Officer Display
- **Status**: Pass
- **Evidence**: Assignments display correctly.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 9. Case Event/History
- **Status**: Pass
- **Evidence**: Case logs work correctly.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 10. Knowledge Library
- **Status**: Pass
- **Evidence**: Documents can be retrieved and viewed.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 11. Legal Q&A / RAG
- **Status**: Pass
- **Evidence**: Base functionality operates; fallback "no-source" response is active.
- **Remaining Risk**: High (Hallucination risk).
- **Required Action**: Explicitly updated the Safety Guide to teach operators how to manually verify citations and identify hallucinations.
- **Blocks Wider Pilot**: No, provided the Relaunch Gate enforces the manual review rules.

## 12. DOCX/template workflow
- **Status**: Pass
- **Evidence**: DOCX templates generate successfully.
- **Remaining Risk**: Medium. Output might have formatting anomalies or inaccurate AI draft text.
- **Required Action**: Users warned to treat outputs as drafts only.
- **Blocks Wider Pilot**: No.

## 13. Audit Log
- **Status**: Pass
- **Evidence**: Prisma creates logs on major write actions.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 14. Error Handling
- **Status**: Pass
- **Evidence**: System does not leak stack traces on standard actions.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 15. Performance
- **Status**: Pass
- **Evidence**: Optimized production build succeeded. Build and Prisma validation clear.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 16. Data Accuracy
- **Status**: Pass
- **Evidence**: Import and database models match successfully.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.

## 17. Security
- **Status**: Pass
- **Evidence**: Pilot data boundaries established.
- **Remaining Risk**: Low.
- **Required Action**: Ensure only non-sensitive data is used in the Pilot.
- **Blocks Wider Pilot**: No.

## 18. User Satisfaction
- **Status**: Not Tested
- **Evidence**: Pilot suspended prior to full data gathering.
- **Remaining Risk**: Unknown until Relaunch Execution.
- **Required Action**: Run the Relaunch Gate and observe.
- **Blocks Wider Pilot**: Yes (need user evidence from controlled pilot first).

## 19. Operational Readiness
- **Status**: Pass
- **Evidence**: Support workflows, Triage board, and feedback forms are all staged.
- **Remaining Risk**: Low.
- **Required Action**: None.
- **Blocks Wider Pilot**: No.
