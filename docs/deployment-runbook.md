## Overview-first dashboard Preview — 2026-10-12

Publish existing PR22 branch only; no Production promotion while integration release gates remain unresolved. Verify dashboard tests (16), case-list tests (3), typecheck, targeted ESLint and unreachable-test-DB production build. Local synthetic browser verifies desktop/mobile, type filter and independent keyboard disclosure; not live database accuracy/Storage readiness/import UAT. No environment or schema change required.

## Case-list split Preview — 2026-10-12

PR22 branch only, no Production promotion. Validate test:case-list (3), test:dashboard (14), typecheck and production build. Isolated synthetic component QA verifies anchor navigation, named separate tables and 320px nested overflow; not live /cases database/filter UAT. Existing query/filter semantics and release gates remain unchanged; no env or schema change needed.

## Officer responsibility Preview — 2026-10-12

Update only the existing PR22 non-production branch; release gates unchanged. Dashboard suite now 14 tests. Local synthetic QA verifies 1366x900 first-viewport figures and 320x720 filter/disclosure without horizontal overflow; real officer count/long labels may expand height. Final typecheck, targeted lint and unreachable-test-DB production build required. No database or environment change for this addition.

## Backlog chart candidate — 2026-10-12

Publish only the existing PR22 branch Preview; do not follow the historical main-push instruction below while integration release gates remain blocked. Validate npm run test:dashboard (12), npm run typecheck, targeted ESLint and production build with unreachable test database. Local synthetic browser QA covers 1366x900 / 320x720, type filter and keyboard details. It does not prove production data accuracy, private Storage readiness or latest XLSM import. No new environment variable/migration is required for these figures.

# Deployment Runbook

This runbook outlines the steps for a successful production deployment, database migration, smoke testing, and rollback procedures.

## 1. Normal Deployment Flow
1. **Local Build**: Run `npm run build` locally to verify the build process.
2. **Git Status Check**: Ensure the repository is clean using `git status --untracked-files=all`.
3. **Commit**: Commit changes cleanly.
4. **Push**: Push to the main branch to trigger a Vercel deployment.
5. **Vercel Build Verification**: Monitor the deployment in the Vercel dashboard and verify that the build succeeds.
6. **Production Smoke Test**: Run the post-deploy smoke test to validate application health.

## 2. Prisma Migration Flow
**Important Notice:** The Vercel build process **MUST NOT** run `prisma migrate deploy`.

- The migration should be run separately to avoid race conditions or build failures.
- Recommended Manual Command: Run `npm run db:migrate:deploy` from your local machine or a controlled environment.
- If the `db:migrate:deploy` script does not exist in `package.json`, it is recommended to add it in a future update, but do not change `package.json` arbitrarily.

## 3. Post-Deploy Smoke Test
After deployment, run a quick smoke test on the following routes:
- `/` -> Expected: 200 OK (or redirect to `/login` if protected)
- `/login` -> Expected: 200 OK
- `/api/health/db` -> Expected: `{"status": "ok", ...}`
- `/api/auth/session` -> Expected: JSON response `{}`, no 500 errors

*If available, use the automated smoke test script: `scripts/smoke-test-production.ps1`*

## 4. Runtime Log Inspection
If issues arise post-deployment:
- Check **Vercel Runtime Logs**, not only the Build Logs.
- Look for common errors:
  - NextAuth missing secret errors
  - Prisma connection or type mismatch issues
  - Middleware redirect loops
  - General 500 errors or permission denied issues.

## 5. Rollback Procedure
If the deployment introduces critical errors:
- **Vercel Rollback**: Use the Vercel Dashboard to **Promote / Redeploy** the previous known-good deployment.
- **Stable Tag**: The last known stable tag is `stable-post-prompt-42c`.
- **Git Revert Strategy**: Use `git revert <commit-hash>` to revert the code changes safely if the fix requires source code modification.
- **Rollback vs. Hotfix**:
  - Rollback immediately if the application crashes (500 errors) or user experience is critically degraded.
  - Hotfix forward if the issue is minor and easily remediated without downtime.
