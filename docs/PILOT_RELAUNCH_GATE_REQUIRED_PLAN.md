# Pilot Relaunch Gate Required Plan

## 1. Executive Summary
The system has successfully passed all critical codebase blockers identified during the Pilot Day 1 suspension. Because the Controlled Pilot was placed in a "No-Go" status previously, a formal relaunch gate must be established and executed. This document outlines the remaining risks and the strict verification requirements necessary before restarting the Pilot monitoring phase for internal stakeholders.

## 2. Previous No-Go Reason
The Pilot was suspended due to a critical build blocker (`next/font/google` resolution error) which caused the production build to fail. Additionally, a P1 typecheck failure was identified and subsequently resolved. The combination of these issues made the system unstable for actual production-like monitoring.

## 3. Blockers Fixed
- **P0 Build Blocker**: Fixed `next/font/google` resolution error.
- **P1 Typecheck Blocker**: Resolved type mismatches.
- All pre-flight checks (build, lint, typecheck, Prisma validation) are now successfully passing without any blocking failures.

## 4. Remaining Risks
- **Data Integrity**: The logic to handle "เสร็จสิ้น" and "เลขแดง" is correct at the import boundary but needs continuous monitoring to ensure dashboard filters don't inadvertently exclude valid active cases.
- **Preview Environments**: PRE-6 (Azure AD Setup) remains a Severity 2 issue for Vercel deployment previews, though it doesn't block the main production deployment.
- **User Training**: SOPs may need updates to reinforce manual verification of AI outputs and correct data entry for case statuses.

## 5. Verification Required Before Relaunch
- Confirmation that no new P0/P1 issues have been introduced.
- Verification that all automated deployment scripts succeed.
- Clear communication to all Pilot stakeholders regarding the resumed status.

## 6. Build / Lint / Typecheck / Prisma Requirements
- **Lint**: Legacy warnings are acceptable but must not contain fatal errors.
- **Typecheck**: Must exit with code 0 (`tsc --noEmit`).
- **Build**: Must successfully create an optimized production build.
- **Prisma Validate/Generate**: Must execute without schema errors.

## 7. Security / Permission Requirements
- Write actions must be verified against current role constraints.
- Any manual DB changes must be logged.
- The system must remain secure against unauthorized data mutations.

## 8. Data Reliability Requirements
- Registry import must correctly interpret "เสร็จสิ้น" when a red case number is present.
- Overdue logic must accurately exclude finalized/completed cases to prevent misleading metrics.

## 9. Legal Q&A Requirements
- The RAG system must provide citations for its answers and warn users when sources are unavailable.
- Users must treat AI output as supplementary and requiring manual legal review.

## 10. DOCX / Template Requirements
- Output documents must not appear as final or official legal documents without manual review and approval.
- Template placeholders must be thoroughly verified for accuracy against the selected case data.

## 11. Relaunch Gate Checklist
- [x] Typecheck passes
- [x] Prisma validation passes
- [x] Build completes successfully
- [x] Codebase is verified free of P0/P1 blockers
- [ ] Stakeholders are notified of Pilot resumption
- [ ] Dashboard metrics reviewed for accuracy on current data

## 12. Recommended Prompt 90
**Prompt 90: Controlled Pilot Relaunch Gate Execution**
