# Go-Live Checklist

## Pre-Launch Verification

- [ ] **Production Environment Variables Set:**
  - `DATABASE_URL` and `DIRECT_URL` (Supabase connection pool and direct connection)
  - `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
  - `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
  - `OPENAI_API_KEY`
  - `ADMIN_BOOTSTRAP_ENABLED=true` (Initially true, then false)

- [ ] **Authentication & Access:**
  - [ ] Microsoft Auth tested in production.
  - [ ] First admin verified (successfully logged in and gained ADMIN role).
  - [ ] **First admin bootstrap disabled** (`ADMIN_BOOTSTRAP_ENABLED=false` set in Vercel after first login).
  - [ ] Non-admin role tested (user lands in PENDING, admin approves, user gains correct access).

- [ ] **Data & Infrastructure:**
  - [ ] Supabase backups confirmed to be running.
  - [ ] Real documents and confidential files are **NOT** committed to the repository.
  - [ ] No `npm run db:seed` run on production with dummy data.

- [ ] **Core Application Flows:**
  - [ ] Dashboard verified (stats calculate correctly, overdue logic accurate).
  - [ ] Registry import tested with safe, non-confidential data (verify no crashes on blank rows or Thai dates).
  - [ ] DOCX export tested (formatting holds, no raw placeholders).
  - [ ] AI source-backed sample tested (AI Draft generates text only from provided context).

- [ ] **Security & Auditing:**
  - [ ] Audit logs verified (checking DB to ensure actions like edits and exports are logged).
  - [ ] Security review completed (no secrets exposed in UI, APIs secure).

- [ ] **Operations:**
  - [ ] User training completed.
  - [ ] Rollback plan ready (documented in `OPERATIONS_RUNBOOK.md`).

## Blockers / Known Issues (To be updated during UAT)
- (Document any blocking issues found during UAT here)

## Stabilization Exit Criteria

- [ ] no open P0 issues
- [ ] no open P1 security/data integrity issues
- [ ] registry import tested with pilot files
- [ ] dashboard logic verified
- [ ] permissions verified
- [ ] AI safety regression passed
- [ ] DOCX export regression passed
- [ ] audit logs verified
- [ ] backup/rollback plan confirmed
- [ ] pilot users trained
- [ ] release decision logged

## Wider Rollout Gate

- [ ] stabilization exit criteria met
- [ ] rollout readiness checklist complete
- [ ] support model assigned
- [ ] role onboarding checklist ready
- [ ] communication sent
- [ ] rollback/pause plan approved
- [ ] adoption metrics defined
- [ ] go/no-go decision logged
