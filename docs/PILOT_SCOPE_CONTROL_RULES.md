# Pilot Scope Control Rules

During the Pilot phase, strict scope control is required to prevent feature creep, maintain system stability, and ensure the safety of legal and data workflows.

## 1. The Feature Freeze Rule
**The system is in a Feature Freeze.** No new features, modules, pages, or architectural refactors will be introduced during the Pilot phase unless explicitly required to resolve a Critical (S1) or High (S2) severity issue related to safety, accuracy, or data integrity.

## 2. What Qualifies as a Bug
A bug is defined as:
- The system behaves contrary to documented requirements or SOPs.
- An existing feature crashes, errors out, or fails to complete its intended workflow.
- Data is corrupted, lost, or displayed incorrectly.

## 3. What Qualifies as a Critical Fix
A critical fix is a code change required because:
- A Pilot Stop Criterion has been triggered.
- A core workflow (Auth, Import, Case Management, RAG, DOCX) is completely blocked for one or more roles.
- There is a severe legal accuracy, security, or data integrity threat.

## 4. What Qualifies as a Feature Request
A feature request is:
- "It would be nice if the system also did X."
- "Can we add this new column to the dashboard?"
- "Can we integrate this with another external system?"
- "Can we change the colors or layout?" (unless it's a severe accessibility blocker).

## 5. Deferral Mandate
**All Feature Requests MUST be deferred.** They will be recorded as Severity 5 (Enhancement) and placed in the backlog for post-Pilot consideration.

## 6. Exception Approval
Only the **Product Owner** can approve an exception to the Feature Freeze. Exceptions will only be granted if a requested change is proven absolutely necessary for the Pilot to continue safely.

## 7. Handling Repeated Feedback
If multiple users request the same feature or complain about the same usability issue:
- Do not build it immediately.
- Acknowledge the feedback.
- Document it as a high-priority post-Pilot roadmap item.
- Provide training or a workaround in the meantime.

## 8. Avoiding One-Off Customizations
Do not build during the Pilot based solely on one user's personal preference. Standardized SOPs must dictate usage.

## 9. Protecting Accuracy over Convenience
If a proposed fix makes a workflow "faster" or "more convenient" but increases the risk of hallucination (RAG), data loss, or bypassing manual review, the fix must be **rejected**. Safety and accuracy supersede speed during the Pilot.

## 10. Prompt Allocation Decision
When deciding when to fix an issue:
- **Prompt 83 (Next Prompt):** Only P1 issues (High severity, major workflow blockers).
- **Later Stabilization (Prompt 84+):** P2 issues (Medium severity, batch fixes).
- **Post-Pilot Roadmap:** P3 and P4 issues.
