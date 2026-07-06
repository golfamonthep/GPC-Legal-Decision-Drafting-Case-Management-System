# Pilot Daily Check-in Process

## 1. Purpose
To maintain tight operational control during the limited Staging Pilot. The daily check-in ensures that critical bugs, legal accuracy issues, and data integrity concerns are caught immediately before they impact operations or mislead users.

## 2. Participants
- Pilot Coordinator (Lead)
- System Operator / IT Admin
- Legal QA Representative (or Lead Legal Officer)
- Select Pilot Users (rotating based on daily usage)

## 3. Duration
- **15-20 Minutes maximum.** Focus on blockers, safety, and triage, not long-term feature discussions.

## 4. Required Daily Questions
During the check-in, the Coordinator must ask active users:
1. What did you try to do today?
2. Did any page or workflow fail?
3. Did any data look wrong (especially imported registry cases)?
4. Did any legal answer or RAG output look unsupported or hallucinated?
5. Did any dashboard number look suspicious?
6. Did any permission or access issue occur?
7. Did any document output (DOCX) look wrong or format incorrectly?
8. What blocked your work?
9. What workaround did you use?
10. Is this a bug, a training issue, or a feature request?

## 5. Issue Review & Intake
- Review new submissions from the `PILOT_FEEDBACK_FORM.md`.
- Ensure all new items are logged in the Triage Board.

## 6. Critical Issue Escalation
- Any issue flagged as **Severity 1** or categorized under **Legal Accuracy, Data Integrity, or Security** must be evaluated immediately against the `PILOT_STOP_AND_ROLLBACK_CRITERIA.md`.

## 7. Containment & Communication
- **Workaround Communication:** If a non-blocking issue is found, document the workaround and communicate it to all pilot users immediately (via chat or email).
- **Feature Request Containment:** Politely but firmly reject or defer feature requests (Severity 5). Remind users that the current phase is for stabilization and safety verification only.

## 8. Daily Decision
At the end of the check-in, the Coordinator must make one of the following decisions:
- **[ ] Continue Pilot:** No critical issues.
- **[ ] Continue with Workaround:** Issues found, but workarounds are effective and safe.
- **[ ] Stop Affected Workflow:** Suspend use of a specific feature (e.g., DOCX export) while the rest of the Pilot continues.
- **[ ] Stop Pilot:** Stop criteria triggered. Halt system access immediately.

## 9. Daily Summary Format
Publish a brief daily summary to the project team:
> **Date:** [Date]
> **Decision:** [Continue / Continue with Workaround / Stop Workflow / Stop Pilot]
> **New Critical Issues:** [Count]
> **Active Workarounds:** [List]
> **Deferred Feature Requests:** [Count]
