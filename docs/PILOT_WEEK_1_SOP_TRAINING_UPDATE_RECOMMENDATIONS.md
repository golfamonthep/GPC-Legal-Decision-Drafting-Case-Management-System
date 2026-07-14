# Pilot Week 1 SOP and Training Update Recommendations

## 1. SOP Gaps Found
- The process for manually verifying AI-generated citations in Legal Q&A needs clearer examples.
- The criteria for marking a case as 'เสร็จสิ้น' (Completed) explicitly based on the presence of a Red Case Number (เลขแดง) was correctly implemented in code but should be more prominent in the SOP to ensure manual entry follows the same standard.

## 2. Training Confusion Found
- Users may be confused about why a case is excluded from the "Overdue" metrics. Training must clarify that any case marked as 'เสร็จสิ้น', 'แล้วเสร็จ', 'ยุติเรื่อง', or with a Red Case Number is automatically treated as finalized and excluded from active overdue queues.

## 3. User Mistakes Observed
- None actively observed due to Pilot suspension pending the Relaunch Gate, but proactive monitoring of manual case status updates is advised.

## 4. Legal Q&A Training Updates Needed
- Reinforce that AI outputs without clear citations should be treated with high skepticism.
- Emphasize that "No Source Found" means the query requires manual legal research outside the RAG system.

## 5. Registry Import Training Updates Needed
- Clarify that the system automatically sets the status of imported cases to 'เสร็จสิ้น' if `redCaseNo` is detected. Operators should not attempt to manually revert this unless the red case number was a data entry error in the source registry.

## 6. Dashboard Interpretation Training Updates Needed
- Explicitly state that "Completed" metrics aggregate multiple sub-statuses including 'เสร็จสิ้น' and 'เสร็จสิ้น (ศาลปกครอง)'.

## 7. DOCX/Template Training Updates Needed
- Instruct Legal Officers that generated DOCX drafts are strictly drafts. They must be downloaded, reviewed, edited if necessary, and then saved manually or uploaded back as finalized versions.

## 8. Permission/Security Training Updates Needed
- Reiterate that Viewer roles cannot mutate data, and users encountering "Permission Denied" errors should request an access escalation rather than attempting workarounds.

## 9. Recommended Document Updates
- Update `PILOT_USER_SOP.md` to highlight the automatic 'เสร็จสิ้น' logic for red cases.
- Update `PILOT_LEGAL_QA_SAFETY_GUIDE.md` to provide examples of citation hallucination and how to detect it.

## 10. Recommended User Communication
- Send a "Pilot Relaunch Briefing" email to all participants. Outline that technical blockers are resolved, the system is stable, and the active Pilot observation period is recommencing. Highlight the key SOP updates above.
