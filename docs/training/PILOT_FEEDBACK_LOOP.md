# Pilot Feedback Loop

## Purpose of Feedback Loop
To create a structured, consistent process for pilot users to report bugs, suggest features, and note usability concerns. This ensures all feedback is captured, triaged, prioritized, tracked, and converted into development work without losing context or exposing sensitive data.

## Who Can Submit Feedback
All authorized pilot users (ADMIN, COMMISSIONER, LEGAL_OFFICER, REGISTRY_OFFICER, VIEWER) who have active accounts and have completed pilot training.

## What Types of Feedback to Collect
We collect:
- Application errors or crashes
- Data inaccuracies (e.g., import failures, export formatting issues)
- Confusing UI/UX or missing documentation
- Unexpected AI outputs
- Feature requests or enhancements
- Security or permissions issues

## How to Classify Issues (Issue Taxonomy)
Issues must be assigned one of the following categories:
- **BUG_IMPORT**: Issues importing cases from Excel.
- **BUG_DASHBOARD**: Dashboard statistics or overdue logic incorrect.
- **BUG_CASE_DETAIL**: Case information missing or updating fails.
- **BUG_DRAFT**: Draft sections failing to save or load.
- **BUG_AI**: AI legal analysis incorrect, wording review fails, or hallucination.
- **BUG_DOCX_EXPORT**: Formatting errors or missing fields in DOCX.
- **BUG_AUTH_PERMISSION**: Role bypass, missing access, or login failures.
- **BUG_DOCUMENT_LINK**: Linking documents to cases fails.
- **DATA_QUALITY**: Corrupted names, dates, or invalid legal terminology.
- **UX_CONFUSING**: Workflow is unclear or confusing.
- **PERFORMANCE**: Page loads slowly or actions time out.
- **SECURITY_PRIVACY**: Exposed data, missing audit logs.
- **FEATURE_REQUEST**: Request for new functionality.
- **TRAINING_NEEDED**: Not a bug, but user requires guidance.
- **SOP_GAP**: Operations documentation needs updating.
- **OTHER**: Anything not fitting above.

## Severity Levels
- **S0_CRITICAL**: Data leak, security breach, production down, unauthorized access, data corruption.
- **S1_HIGH**: Core workflow blocked, import/export broken, wrong permission behavior, severe legal drafting risk.
- **S2_MEDIUM**: Important workflow impaired but workaround exists.
- **S3_LOW**: Minor bug, wording issue, UI friction.
- **S4_SUGGESTION**: Improvement request or training suggestion.

## Priority Levels
- **P0_IMMEDIATE**: Must be fixed immediately (interrupts current work).
- **P1_THIS_WEEK**: Fix required during current iteration.
- **P2_NEXT_SPRINT**: Scheduled for next development cycle.
- **P3_BACKLOG**: Added to general backlog for future consideration.
- **P4_PARKED**: Acknowledged but no plans to fix currently.

## Triage Rules
- Any SECURITY_PRIVACY issue with S0/S1 becomes **P0**.
- Any data corruption risk becomes **P0**.
- Any permission bypass becomes **P0**.
- Any AI output that changes legal conclusion or invents source becomes at least **P1**.
- Import failure affecting all users becomes **P1**.
- DOCX layout issue without legal/data impact is usually **P2/P3**.
- Training confusion repeated by 3+ users becomes **P2**.
- Feature requests without pilot blocker impact become **P3/P4**.

## Triage Cadence & Review
- **Daily**: Admin/Triage Team reviews newly submitted feedback to assign severity and priority. S0/P0 issues are immediately escalated.
- **Weekly**: A structured pilot review meeting occurs (using PILOT_WEEKLY_REVIEW_TEMPLATE.md) to discuss trends, blockers, and update pilot users on upcoming fixes.

## Who Reviews Feedback
- **System Admin**: Primary triage, mapping to severity and technical validity.
- **Legal Officer / Lead**: Validates issues related to AI accuracy and DOCX correctness.

## Escalation Rules
- S0 issues require immediate paging to developers. Stop pilot operations if a data leak or corruption is ongoing.
- S1 issues require a dedicated patch release within 24-48 hours.

## How Issues Become Development Tasks
- Triaged issues (status: `TRIAGED` or `IN_PROGRESS`) are documented in `PILOT_ISSUE_LOG.md` or the `PILOT_BACKLOG.md`.
- Development team picks up P0/P1 issues immediately, while P2+ go into the backlog for planning.

## How to Close Feedback
- Issue status is updated to `FIXED`, `WONT_FIX`, `DUPLICATE`, `NEEDS_TRAINING`, or `DOCUMENTED`.
- Resolution notes must explain what was done or why no action was taken.

## Communicating Fixes Back to Pilot Users
- Weekly Release Notes (`PILOT_RELEASE_NOTES_TEMPLATE.md`) summarize closed issues.
- If the issue was P0/P1 and blocking a specific user, that user is contacted directly once resolved.

## Go/No-Go Criteria
### Go Criteria
- No open S0 issues.
- No unresolved S1 security/data corruption issues.
- Registry import works with pilot files.
- Dashboard logic verified.
- Permissions verified.
- DOCX export usable.
- Audit logs verified.

### No-Go Criteria
- Unresolved permission bypass.
- Data corruption.
- Repeated import failure.
- AI tool generates unsupported legal conclusions.
- DOCX export inserts wrong facts.
- Confidential data handling concern.
