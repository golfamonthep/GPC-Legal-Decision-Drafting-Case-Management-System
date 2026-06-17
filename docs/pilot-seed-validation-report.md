# Pilot Seed Validation Report

**Status**: Blocked — Execution handed off to owner (Prompt 50C) and requires Safety Audit confirmation (Prompt 50D).

**Approval Received (Prompt 50C)**: The owner has confirmed that the Preview DB is safe, non-production, and separate from production. They have provided explicit approval to execute the pilot seed.

**Safety Audit (Prompt 50D)**: The agent execution in Prompt 50C attempted commands against what turned out to be ephemeral local databases because staging credentials were not present in the agent's environment. **No database mutations occurred during Prompt 50C.** Real staging seed remains pending until the owner confirms successful execution and staging DB separation themselves.

**Blocker**: The agent does not have access to the staging `DATABASE_URL` (which is stored securely in the Vercel Dashboard and not shared to prevent credential leaks). Furthermore, Microsoft Entra ID integration requires real staff accounts to be mapped to the seeded roles, which the agent cannot do.

**Required Owner Action**:
1. Run the seed script locally with the staging `DATABASE_URL`:
   ```powershell
   $env:DATABASE_URL = "<staging-database-url>"
   $env:PILOT_SEED_CONFIRM = "YES"
   $env:ALLOW_STAGING_PILOT_SEED = "YES"
   npx tsx scripts/seed-pilot-data.ts
   ```
2. Verify in Supabase that the seed created the pilot prefix records (`PILOT-CASE-`, `@example.test`) and did not touch production.
3. Map real staff Microsoft accounts to the seeded roles via the admin UI (`/admin/users`).
4. Execute the live pilot workflow tests manually and report back.
5. **Do not proceed** to controlled real-case trial until these steps are completed and verified by the owner.

