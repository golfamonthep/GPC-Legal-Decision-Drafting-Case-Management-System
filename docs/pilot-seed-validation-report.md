# Pilot Seed Validation Report

**Status**: Blocked — Execution handed off to owner.

**Approval Received (Prompt 50C)**: The owner has confirmed that the Preview DB is safe, non-production, and separate from production. They have provided explicit approval to execute the pilot seed.

**Blocker**: The agent does not have access to the staging `DATABASE_URL` (which is stored securely in the Vercel Dashboard and not shared to prevent credential leaks). Furthermore, Microsoft Entra ID integration requires real staff accounts to be mapped to the seeded roles, which the agent cannot do.

**Required Owner Action**:
1. Run the seed script locally with the staging `DATABASE_URL`:
   ```powershell
   $env:DATABASE_URL = "<staging-database-url>"
   $env:PILOT_SEED_CONFIRM = "YES"
   $env:ALLOW_STAGING_PILOT_SEED = "YES"
   npx tsx scripts/seed-pilot-data.ts
   ```
2. Map real staff Microsoft accounts to the seeded roles via the admin UI (`/admin/users`).
3. Execute the live pilot workflow tests manually and report back.

