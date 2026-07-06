# Pilot Issue Prioritization Matrix

This matrix defines how to prioritize issues reported during the Pilot phase to ensure safe and structured resolution.

## Prioritization Factors
When evaluating an issue, consider the following factors:
1. **Severity:** S1 (Critical) to S5 (Enhancement).
2. **Frequency:** How often does it happen? (Rarely vs. Every time).
3. **Legal Risk:** Does it compromise the accuracy of legal drafting or reasoning?
4. **Data Risk:** Does it risk corrupting, losing, or misattributing case records?
5. **Security Risk:** Is sensitive data exposed? Are roles bypassed?
6. **Users Affected:** One user vs. All users.
7. **Workflow Importance:** Does it affect a core Pilot workflow (Import, RAG, DOCX)?
8. **Workaround Availability:** Is there a simple, safe workaround?
9. **Fix Complexity:** Can it be fixed in 1 hour safely, or does it require architectural changes?
10. **Pilot Continuation Impact:** Can the Pilot proceed without this fix?

---

## Priority Levels

### P0: Immediate Stop / Fix Now
- **Criteria:** Triggers a Pilot Stop Criterion. Severity 1. High legal, data, or security risk. No safe workaround exists.
- **Response Time Expectation:** Immediate escalation. Pilot or affected workflow suspended.
- **Owner:** Lead Engineer / Product Owner.
- **Required Documentation:** Root cause analysis, rollback/containment steps.
- **Verification Requirement:** Must be verified by Lead Engineer and Legal QA before Pilot resumes.

### P1: Next Prompt Fix
- **Criteria:** Severity 2. Major workflow broken but a painful workaround exists. High frequency or affects many users. High risk of user error leading to data/legal issues if left unfixed.
- **Response Time Expectation:** Must be included in the very next stabilization prompt (e.g., Prompt 83).
- **Owner:** Development Team.
- **Required Documentation:** Triage Board entry, detailed reproduction steps.
- **Verification Requirement:** Verified in Staging by the original reporter and QA.

### P2: Scheduled Stabilization
- **Criteria:** Severity 3. Medium impact. Viable workaround exists. Does not pose legal, data, or security risks.
- **Response Time Expectation:** Group into a future batch-fix prompt (e.g., Prompt 84 or 85). Do not interrupt current Pilot workflows.
- **Owner:** Development Team.
- **Required Documentation:** Triage Board entry.
- **Verification Requirement:** Standard QA verification.

### P3: Backlog
- **Criteria:** Severity 4. Low impact. Minor visual, text, or convenience issues.
- **Response Time Expectation:** Logged in the system backlog. Will not be fixed during the Pilot unless trivial and bundled safely with a higher priority fix.
- **Owner:** Product Manager.
- **Required Documentation:** Triage Board entry.
- **Verification Requirement:** None during Pilot.

### P4: Future Enhancement
- **Criteria:** Severity 5. Feature requests, new capabilities, or major UI redesigns.
- **Response Time Expectation:** Deferred until after the Pilot phase concludes.
- **Owner:** Product Manager.
- **Required Documentation:** Triage Board entry. Explicitly marked as "Deferred".
- **Verification Requirement:** None.
