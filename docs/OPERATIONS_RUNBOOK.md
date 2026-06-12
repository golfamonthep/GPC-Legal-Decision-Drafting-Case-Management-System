# Operations Runbook

## Overview
This document outlines standard operating procedures for the ก.พ.ค.ตร. legal decision drafting system in a production environment.

## 1. Verifying System Health

### 1.1 Check Vercel Deployment
- Log into Vercel dashboard.
- Select the production project.
- Ensure the latest deployment is marked `Ready`.
- Check the "Functions" tab for any 5xx error spikes.

### 1.2 Check Supabase Tables
- Log into Supabase dashboard.
- Go to the "Table Editor".
- Verify that `User`, `Case`, `CaseEvent`, and `AuditLog` exist and contain expected data.
- Check the "Database" -> "Migrations" tab to ensure no migrations are stuck or failed.

### 1.3 Check Database Health Route
- Navigate to `https://[production-url]/api/health/db`.
- Expected Response: `{"status": "ok", "message": "Database is connected"}`.
- If it returns an error, it will be generic (e.g., "Database connection failed"). Check Vercel logs for the actual error.

## 2. Inspecting Logs

### 2.1 Vercel Logs
- In Vercel, go to the "Logs" tab of your production deployment.
- Filter by `Error` to identify API crashes or timeout issues.
- Search for `[AuditLog]` if you output safe audit traces to stdout.

### 2.2 Verify Migration Logs
- Migrations run during the build step.
- In Vercel, click on the latest Deployment -> "Building".
- Look for `prisma migrate deploy` in the logs.
- Ensure it says `x migrations found, 0 applied` (if up to date) or `x migrations applied successfully`.

## 3. Incident Management

### 3.1 Rollback Vercel Deployment
- If a new deployment causes critical failures, immediately rollback.
- In Vercel, go to "Deployments".
- Find the last known good deployment.
- Click the three dots -> "Promote to Production" or "Rollback".

### 3.2 Handling Failed Imports
- If a user reports a failed Excel import, ask for the exact error message from the UI.
- Verify if the file contained malformed data (e.g., `#VALUE!` or empty required cells).
- Check the `AuditLog` for import attempts.
- Instruct the user to fix the highlighted rows in Excel and retry. The system skips existing records safely.

### 3.3 Handling AI API Failures
- If AI features timeout or return 500s:
- Check OpenAI API status (https://status.openai.com).
- Check Vercel logs for rate limit (`429`) or auth (`401`) errors.
- Ensure billing is active in the OpenAI platform.

### 3.4 Handling DOCX Export Failures
- If export fails, check if the draft contains unusual characters or extremely large text blocks causing memory limits.
- Check Vercel function timeout logs (Vercel hobby plan has 10s limit, Pro has 300s).

## 4. Secret & Key Rotation

### 4.1 Rotate Supabase Password
- Go to Supabase -> Project Settings -> Database.
- Click "Reset Database Password".
- Immediately update `DATABASE_URL` and `DIRECT_URL` in Vercel Environment Variables.
- Trigger a new deployment in Vercel to apply the changes.

### 4.2 Rotate OpenAI Key
- Go to OpenAI platform -> API Keys.
- Generate a new key.
- Update `OPENAI_API_KEY` in Vercel Environment Variables.
- Delete the old key in OpenAI.
- Trigger a new deployment in Vercel.

### 4.3 Rotate Microsoft Client Secret
- Go to Azure Portal -> Entra ID -> App Registrations -> Certificates & secrets.
- Create a new Client Secret.
- Update `AZURE_AD_CLIENT_SECRET` in Vercel.
- Delete the old secret in Azure.
- Trigger a new deployment in Vercel.

## 5. User Management

### 5.1 Disable First Admin Bootstrap
- Ensure `ADMIN_BOOTSTRAP_ENABLED=false` in Vercel production environment variables after the first admin logs in.
- This prevents new users from automatically becoming admins if the DB is empty (which shouldn't be the case after first login, but it's a safe guard).

### 5.2 Add/Disable Users
- Only `ADMIN` users can do this.
- Go to `/admin/users` in the application.
- To disable a user, change their role to `DISABLED`.
- They will be immediately blocked on their next API request or page load.

## 6. Backup and Recovery Checklist

### 6.1 Supabase Backup Verification
- Supabase performs automatic daily backups (on Pro plan).
- Go to Supabase -> Database -> Backups.
- Verify that Point-in-Time Recovery (PITR) is enabled if required, or daily logical backups are succeeding.

### 6.2 Pre-Import Export
- Before doing a massive historical data import, it is recommended to take a manual backup.
- In Supabase, use `pg_dump` via CLI or the dashboard export tools to download a snapshot.

### 6.3 Restore Procedure (Placeholder)
- *Warning*: Restoring a DB overwrites current state. Coordinate with users to stop activity.
- Go to Supabase -> Database -> Backups -> Restore.
- Select the desired point in time or snapshot.
- Monitor restoration progress.

### 6.4 Version Control & DB Safety
- Ensure GitHub `main` branch protection is enabled (require PR reviews, no force pushes).
- **CRITICAL**: Never edit the production database manually via SQL unless it is an absolute emergency. Use the application UI or prisma migrations.
