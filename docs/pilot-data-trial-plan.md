# Pilot Data Trial Plan

## 1. Pilot Environment
The pilot data seeding will be performed on the **Local Development Database** and **Preview/Staging Database** first.
If the pilot is to be executed in Production, it requires the `ALLOW_PRODUCTION_PILOT_SEED=YES` flag and explicit management approval.

## 2. Data Sensitivity Rules
- **No real sensitive case data** unless explicitly sanitized.
- All pilot data uses placeholder labels (e.g., `PILOT_PETITIONER_1`, `PILOT-CASE-001`).
- Email addresses used are `.test` or `.invalid` domains (e.g., `uat-admin@example.test`).
- Draft texts use dummy string values (`PILOT_FACTS_TEXT`).

## 3. Access Control
- Access to pilot data is restricted to users with assigned pilot roles.
- `uat-admin@example.test` (ADMIN)
- `uat-case-manager@example.test` (REGISTRY_OFFICER)
- `uat-drafter@example.test` (LEGAL_OFFICER)
- `uat-reviewer@example.test` (COMMISSIONER)
- `uat-viewer@example.test` (VIEWER)

## 4. Production Scope
Production is **out of scope** for automated seeding unless explicitly confirmed with `ALLOW_PRODUCTION_PILOT_SEED=YES`. 

## 5. Go/No-Go Criteria
- **Go**: Dry-run succeeds without errors, and no secrets or PII are detected in the seed script.
- **No-Go**: Any connection to production without explicit flags, or any presence of real sensitive case data.

## 6. Rollback / Cleanup Approach
- Identify pilot records using the `PILOT-` or `PILOT_` prefix in string fields (e.g., `blackNumber`, `name`).
- Delete cases where `blackNumber` starts with `PILOT-CASE-`.
- Delete users where email ends with `@example.test`.
- Do NOT delete non-pilot records.
- Cleanup will require a manual verification of records to delete.

## 7. Approval Checklist
- [x] Dry-run executed successfully.
- [ ] Management approval for Preview/Staging execution.
- [ ] Execution of actual seed script.

## Dry-run Result
Dry-run executed successfully via PowerShell script validation. Seed script not executed yet for real data. Actual pilot seeding is not executed until explicitly approved.
