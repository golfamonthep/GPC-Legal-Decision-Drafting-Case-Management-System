# Incident Response Runbook

This runbook covers common incidents encountered in the environment and provides actionable remediation steps.

## 1. Vercel Build Fails with Module Not Found
**Symptoms:** The build fails on Vercel claiming a file or module cannot be found, but it works locally.
**Actions:**
- Check for untracked files locally that were not committed.
- Verify Linux case sensitivity (Vercel runs Linux, Windows is case-insensitive). A file renamed from `File.ts` to `file.ts` might not be tracked correctly by Git.
- Run `git status --untracked-files=all` locally.
- **Do not** remove features just to make the build pass; resolve the import or casing issue instead.

## 2. Prisma Schema / Type Errors
**Symptoms:** Build or runtime errors related to Prisma Client types or missing properties.
**Actions:**
- Run `npx prisma generate` to ensure the client is up-to-date.
- Check the generated client path.
- Ensure that you avoid importing model types from the wrong client path (e.g., default node_modules vs custom generated path).

## 3. Runtime Page Crash with NextAuth NO_SECRET
**Symptoms:** Pages crash at runtime, or NextAuth logs show a `NO_SECRET` error.
**Actions:**
- Set the `NEXTAUTH_SECRET` environment variable in the Vercel Production Environment dashboard.
- Set the `NEXTAUTH_URL` environment variable appropriately.
- Redeploy the application.
- If a secret was previously leaked in code or logs, rotate the leaked secrets immediately.

## 4. Database Health Fails
**Symptoms:** `/api/health/db` returns an error, or the app cannot connect to the database.
**Actions:**
- Check the `DATABASE_URL` / `POSTGRES_URL` in the environment variables.
- Verify the Supabase pooler host and port configuration.
- Confirm the status via `/api/health/db`.
- **Do not** log database credentials to the console while troubleshooting.

## 5. Admin Maintenance Action Crash
**Symptoms:** The maintenance console crashes or throws errors during actions.
**Actions:**
- Confirm that no database writes are occurring during the server component render phase.
- Maintenance actions must be strictly **POST-only**.
- Audit writes should only happen during explicit user actions (e.g., button clicks triggering an API), not during page load.

## 6. Bad AI Bulk Edit
**Symptoms:** AI-assisted bulk changes corrupted files or caused widespread build failures.
**Actions:**
- Stop the agent immediately.
- Inspect the changes using `git diff`.
- Restore only the corrupted files using `git checkout <file>`.
- Avoid broad route edits using PowerShell scripts; rely on precise tool usage instead.
