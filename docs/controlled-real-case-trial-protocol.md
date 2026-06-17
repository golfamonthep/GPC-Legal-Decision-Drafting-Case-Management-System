# Controlled Real-Case Trial Protocol

## Purpose
Define how to test the system safely with real or near-real case data following the pilot seeding phase.

## 1. Data Classification
- **Dummy**: Fake data generated programmatically (e.g., `PILOT_PETITIONER_1`). Safe anywhere.
- **Anonymized**: Real case structure with all PII replaced by dummy text. Safe for local and staging.
- **Sanitized Real**: Real case structure with minimal required real facts but national IDs, phones, addresses removed. Safe for staging/production pilot.
- **Sensitive Real**: Full real unredacted case. Production only, after sign-off.

## 2. Minimum Anonymization Checklist
Before using real data in a pilot test, remove/replace:
- [x] National IDs (บัตรประชาชน 13 หลัก)
- [x] Phone numbers
- [x] Personal addresses
- [x] Confidential witness names/details
- [x] Sealed/court-sensitive details

## 3. Approval Requirement
- Requires Management or Legal Lead approval before entering ANY sanitized real cases into the production system for a pilot test.

## 4. Suggested Controlled Trial Size
- Start with **3 to 5 sanitized cases**.
- Ensure they cover common workflows (e.g., 2 อุทธรณ์, 2 ร้องทุกข์).
- Do not attempt a full production rollout until these 3-5 cases successfully reach the Dispatch stage.

## 5. Trial Execution
- **Participants**: Selected pilot staff (1 Admin, 1 Registry, 2 Legal Officers, 1 Commissioner).
- **Observation**: System admin monitors the `/api/health/db` and error logs during the session.
- **Issue Reporting**: Use standard bug tracking with screenshots, omitting any PII from bug reports.

## 6. Criteria
- **Success Criteria**: Cases can be ingested, assigned, drafted, approved, and dispatched without workarounds.
- **Stop Criteria**: System 500 errors, broken access controls, or data leak risks.
- **Rollback**: If trial fails critically, progress cases to a "Cancelled" state manually, and fix the system before resuming. Do not delete real case records arbitrarily.

## 7. Current Trial Readiness Status

- **Pilot Dry-Run Passed**: Yes.
- **Preview/Staging Seed Executed**: No — **BLOCKED at Phase 2 (Environment Confirmation)**.
- **System Ready for Real-Case Trial**: ❌ Not ready — blocked on environment classification.
- **Preview/Staging Live Workflow Tests**: ❌ Not executed — all 7 role accounts blocked (seed not executed).
- **Build Validation (Prompt 50)**: ✅ All 67 routes compiled. TypeScript clean.
- **Static Code Audit (Prompt 50)**: ✅ All workflow routes structurally verified.
- **Remaining Blockers (Prompt 50 outcome)**:
  1. **CRITICAL**: Owner must verify in Vercel dashboard whether preview deployment uses a separate non-production database (`DATABASE_URL` under "Preview" environment). If shared with production → must establish a local staging DB instead.
  2. Once non-production DB is confirmed: approve real preview/staging seed, execute, and verify.
  3. Role accounts (UAT_ADMIN, UAT_CASE_MANAGER, UAT_DRAFTER, UAT_REVIEWER, UAT_VIEWER) must be seeded and verified in confirmed non-production DB.
  4. COMMISSIONER (UAT_REVIEWER) and VIEWER live accounts remain a known gap since Prompt 47.
  5. Final live authenticated workflow tests must pass before real-case trial approval.
- **Go/No-Go (Prompt 50)**: CONDITIONAL GO — no Severity A/B defects; blocked on environment/accounts.
- **Stop Criteria**: Any system 500 errors, broken access controls, data leak risks, or failure of real data anonymization.
- **Recommended Next Step**: Prompt 50B — Confirm Vercel preview DB classification, approve seed, execute live workflow tests.
