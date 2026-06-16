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
