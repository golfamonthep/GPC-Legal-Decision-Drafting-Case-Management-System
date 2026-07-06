# Pilot Weekly Review Process

## 1. Purpose
To synthesize daily feedback, assess overall Pilot health, evaluate system stability, and decide the specific scope of the next stabilization prompt (e.g., Prompt 83).

## 2. Participants
- Product Owner
- Pilot Coordinator
- QA Lead / Lead Engineer
- Lead Legal Officer / Commissioner Rep

## 3. Required Inputs
- Triage Board records for the week.
- Daily Check-in summaries.
- System logs (audit logs, RAG query logs, error logs).

## 4. Weekly Review Agenda

### A. Issue Summary
- Total issues reported this week:
- Issues fixed/closed:
- Issues currently open:

### B. Distribution Analysis
- **By Severity:** S1 (Critical), S2 (High), S3 (Medium), S4 (Low), S5 (Enhancement).
- **By Feature Area:** Dashboard, Import, Case List, RAG, DOCX, Auth/Roles.

### C. Critical Domain Review
- **Legal Accuracy Concerns:** Review any instances of hallucination, bad citations, or misleading reasoning. Were they caught by manual review?
- **Data Integrity Concerns:** Review any data loss, duplication, or corruption incidents.
- **Security/Permission Concerns:** Review any role bypasses or data leakage.
- **Dashboard Reliability:** Do the metrics accurately reflect the database?
- **Registry Import Reliability:** Success rate of Excel uploads.
- **DOCX/Template Reliability:** Template accuracy and generation success rate.

### D. Usability and Training
- Review repeated usability issues. Are they system flaws, or gaps in the `PILOT_USER_SOP.md`?

### E. User Satisfaction
- Summary of user feedback. Is the system helping or hindering their work?

### F. Scope Control Decision
- Review deferred feature requests. Reiterate commitment to Feature Freeze. Only approve scope expansion if absolutely necessary for legal accuracy or data safety.

### G. Next Prompt Recommendation
- Define the exact focus for the next AI Prompt (e.g., Prompt 83).
- Which specific issues from the Triage Board will be included in the batch fix?

### H. Weekly Pilot Decision
- **[ ] Go:** Continue Pilot as normal.
- **[ ] Conditional Go:** Continue Pilot with specific workflows restricted until fixes are applied.
- **[ ] No-Go (Stop):** Suspend Pilot pending major architectural or systemic fixes.
