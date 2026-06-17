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
