# Pilot User SOP and Training Manual (GPC Legal System)

## 1. Introduction
This manual provides standard operating procedures (SOPs) for the limited Pilot rollout of the GPC Legal Decision Drafting & Case Management System. The Pilot environment uses a staging database (Staging DB) and is strictly separated from production data.

## 2. Practical Pilot User Guide
**Accessing the System:**
- Log in using your designated Microsoft Entra ID (Azure AD) pilot account.
- Note your Role on the dashboard (Admin, Registry Officer, Legal Officer, Commissioner, Viewer).
- Only perform actions that correspond to your assigned role.

## 3. Admin / Operator Guide
**User & Role Management:**
- Navigate to `/admin/users` to view registered accounts.
- Map Microsoft Entra ID accounts to appropriate roles.
- Monitor system health and audit logs.
- Manage system dictionaries and case status workflows if required.

## 4. Legal Officer Workflow Guide
**Case Assignment & Drafting:**
- View assigned cases in the Dashboard or Case List (`/cases`).
- Review the case details, schedule meetings, and update proceedings (`/cases/[id]`).
- Use the **AI Draft Section Assistant** cautiously. Always review AI-generated texts.
- Request legal insights via the **Legal Q&A (RAG)** tab for historical reference.
- Export case outputs to DOCX format and manually adjust any specific official formatting (e.g., Sarabun font alignment).

## 5. Reviewer / Executive Quick Guide
**Metrics & Status Overview:**
- Navigate to `/dashboard` or `/executive` to view overarching case statistics.
- Monitor "Overdue" markers. Cases that are marked "เสร็จสิ้น" (Closed) or have a "เลขแดง" (Red Number) will not trigger overdue alarms.
- Do not attempt to modify case details; your role is view-only for operational data.

## 6. Known Limitations
- **DOCX Generation:** The AI-generated DOCX may not perfectly align with Thai official document standards (ระเบียบงานสารบรรณ). Manual formatting in Microsoft Word is required.
- **RAG Latency:** Complex retrieval queries might take several seconds due to Vercel's serverless architecture and vector search size.
- **Data Import (Excel):** The Excel importer requires an exact template structure. Missing required columns may cause rows to be skipped.

## 7. Do/Don't Rules for Legal Q&A
- **DO** use the RAG system to find relevant previous cases or specific regulations.
- **DO** manually verify the citations returned by the AI.
- **DON'T** trust AI outputs blindly without cross-referencing actual legal documents.
- **DON'T** assume the AI has context outside of the approved knowledge base.

## 8. Manual Verification Checklist
Before approving a drafted document:
- [ ] Has the document been reviewed by a human legal expert?
- [ ] Are all cited laws and previous cases accurate?
- [ ] Is the generated DOCX layout formatted properly in Microsoft Word?
- [ ] Are case statuses up to date in the Case Management module?

## 9. Issue Reporting Template
If an error or hallucination occurs, report it using this format:
- **Date/Time:** 
- **User Role:** 
- **Action Performed:** (e.g., Exporting DOCX for Case ID XXX)
- **Expected Outcome:** 
- **Actual Outcome:** 
- **Error Message (if any):** 
- **Screenshot Attached:** [Yes/No]

## 10. Pilot Acceptance Criteria
- 100% of Pilot cases successfully imported via Excel without data corruption.
- Legal Officers can create, edit, and export drafts for their assigned cases.
- Legal Q&A (RAG) refuses to answer questions outside the knowledge base correctly.
- Admin role can successfully reassign permissions.

## 11. Pilot Rollback / Stop Criteria
- **Immediate Stop:** If any actual Production data leaks into the Staging environment.
- **Immediate Stop:** If sensitive endpoints become publicly accessible without authentication.
- **Rollback:** If DOCX generation crashes repeatedly affecting workflow progress.

## 12. Training Agenda
- **Day 1 (Morning):** System Overview & Login Setup (All Roles)
- **Day 1 (Afternoon):** Registry Import & Case Assignment (Admin/Registry Officer)
- **Day 2 (Morning):** Drafting, Meetings, and RAG usage (Legal Officers)
- **Day 2 (Afternoon):** Dashboard Monitoring (Executives) & Open Q&A
