# Pilot User Standard Operating Procedure (SOP)

## 1. Purpose
The purpose of this document is to guide internal users during the controlled Pilot phase of the GPC Legal Decision Drafting & Case Management System. It establishes safe operating procedures, defines workflow limitations, and outlines mandatory compliance rules.

## 2. Pilot Scope
- **Environment**: Staging / Pilot Database only.
- **Allowed Activities**: Case search, assignment tracking, document drafting using AI support, registry import.
- **Limitations**: The system is NOT a substitute for official legal judgment. All outputs must be manually reviewed.
- **Case Volume**: Up to 50 active pilot cases.
- **Pilot Duration**: 4 weeks.
- **Data Privacy**: Only sanitized or non-highly classified test cases should be uploaded.

## 3. User Roles
- **Admin**: System configuration and role management.
- **Registry Officer**: Importing registry Excel files and verifying data accuracy.
- **Legal Officer**: Reviewing cases, updating status, drafting documents, using Legal Q&A.
- **Commissioner / Reviewer**: Final review and approval of case status.
- **Executive Viewer**: Viewing dashboards and tracking metrics.

## 4. Login Procedure
1. Access the Pilot URL (provided by Pilot Coordinator).
2. Use authorized Microsoft Entra ID pilot credentials.
3. Verify your assigned role in the top right corner.

## 5. Dashboard Usage
- Review assigned case loads and overdue metrics.
- Note: Metrics reflect staging data and should not be used for official organizational reporting.

## 6. Registry Import Procedure
1. Navigate to the Import section.
2. Upload the standard Excel registry format.
3. Review the preview for red/black number distinction and duplicates.
4. Confirm import.

## 7. Case List Usage
- Use filters (status, officer, date) to locate cases.
- Verify status reflects the current real-world status.

## 8. Case Detail Usage
- Review plaintiff, defendant, and case history.
- Cross-reference uploaded documents with physical files if necessary.

## 9. Case Status Handling
- Update status sequentially based on the workflow.
- Ensure all mandatory fields are filled before progressing to "Closed/Completed".

## 10. Completed Case Rules
A case must be treated as completed and must not be counted as overdue if:
- status = "เสร็จสิ้น"
- status = "เสร็จสิ้น (ศาลปกครอง)"
- case has "เลขแดง" (Red Number)
- case contains text indicating "แดงแล้ว"

## 11. Overdue Case Interpretation
- Overdue cases are those past their SLA that do not meet the "Completed Case Rules" above.
- If an overdue case is actually closed, update the status immediately.

## 12. Legal Q&A Usage
- Use Legal Q&A to search for precedents and legal reasoning.
- **Mandatory**: Validate all citations against official source documents.

## 13. Knowledge Library Usage
- Search existing jurisprudence and uploaded regulations.

## 14. DOCX/Template Usage
- Generate draft documents using provided templates.
- Always review the exported DOCX file manually for formatting and content accuracy.

## 15. Document Export Procedure
- Navigate to Case Detail > Export.
- Select the target template and download.

## 16. Audit Log Expectations
- All status changes, exports, and document views are tracked.
- Do not share accounts.

## 17. Error Reporting Procedure
- Use the Pilot Issue Report Template to document any errors.
- Submit reports to the Pilot Coordinator immediately.

## 18. Data Privacy Rules
- Do not upload un-redacted highly sensitive cases outside the agreed Pilot scope.

## 19. Manual Legal Review Rules
- ALL AI-generated text and templates must be verified by a responsible legal officer before official use.

## 20. What Users Must Not Do
- Do not use Pilot outputs for official court filings without manual review.
- Do not share login credentials.
- Do not treat AI answers as definitive legal advice.

## 21. Daily Pilot Checklist
- [ ] Log in and verify role.
- [ ] Check assigned cases.
- [ ] Update case statuses accurately.

## 22. End-of-Week Pilot Checklist
- [ ] Verify all completed cases are marked appropriately.
- [ ] Submit weekly issue reports to the coordinator.
