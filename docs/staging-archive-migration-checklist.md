# Staging Archive Migration Checklist

**WARNING**: DO NOT run any of these commands against production. This checklist is strictly for applying the archive and retention schema updates to the staging database.

## Prerequisites
- The environment is explicitly confirmed as Staging (not Production).
- You have the `DIRECT_URL` for the Staging Supabase session-mode pooler (port 5432).

## Migration Steps

1. **Verify Staging Target**
   Confirm that your shell session is using the Staging `DIRECT_URL` and `DATABASE_URL`. Do not commit these values.
   ```powershell
   $env:DIRECT_URL="<staging-direct-url>"
   $env:DATABASE_URL="<staging-runtime-url>"
   ```

2. **Generate Migration (If Needed)**
   If the migration file has not been created yet (from Prompt 55 schema changes):
   ```bash
   npx prisma migrate dev --name add_archive_retention_schema
   ```

3. **Deploy Migration to Staging**
   ```bash
   npx prisma migrate deploy
   ```

4. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

## Verification
- Connect to the Staging database via Supabase Dashboard or Prisma Studio.
- Verify the `ArchiveBatch` and `ArchiveBatchItem` tables exist.
- Verify `CaseArchiveRecord` has `retentionDueAt` and `previousStatusBeforeArchive` columns.

## Rollback Notes
- Migrations are additive. No destructive drops are included.
- If an issue occurs, you can manually drop the new tables or columns in staging (since there is no production data at risk), or restore from a staging backup.
