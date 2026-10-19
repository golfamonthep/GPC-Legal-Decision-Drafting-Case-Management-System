# Environment Variables (Production)

This document outlines the required and optional environment variables for the application.

**Important Rules:**
- Never commit actual secrets into source control.
- Ensure all values are correctly set in the Vercel Production Environment.
- Provide safe placeholder examples below.

## 1. Auth Group
Configuration for NextAuth.js authentication.

- `NEXTAUTH_SECRET` (Required in Production)
  - Purpose: Secret used to encrypt NextAuth.js tokens.
  - Scope: Production / Preview / Development
  - Example: `super-secret-random-string`
- `NEXTAUTH_URL` (Required in Production)
  - Purpose: The canonical URL of the application.
  - Scope: Production / Preview / Development
  - Example: `https://your-production-domain.vercel.app`
- `AUTH_SECRET` (Optional)
  - Purpose: Fallback or alternative auth secret if used.
  - Scope: Production / Preview
  - Example: `another-secret-string`
- `AUTH_URL` (Optional)
  - Purpose: Fallback or alternative auth URL if used.
  - Scope: Production / Preview
  - Example: `https://your-production-domain.vercel.app/api/auth`
- `AUTH_TRUST_HOST` (Optional)
  - Purpose: Indicates whether the host is trusted for authentication.
  - Scope: Production / Preview
  - Example: `true`

## 2. Database Group
Configuration for connecting to the PostgreSQL database (e.g., via Supabase).

- `DATABASE_URL` or `POSTGRES_URL` (Required)
  - Purpose: The connection string for the database.
  - Scope: Production / Preview / Development
  - Example: `postgres://user:password@host:port/database`
  - Notes: When using a Supabase pooler, ensure you connect to the pooled port (e.g., `6543`) rather than the direct connection port (e.g., `5432`).

## 3. Microsoft Graph / Entra ID Group
Configuration for Microsoft integration (if enabled).

- `MICROSOFT_TENANT_ID` (Optional)
  - Purpose: The Entra ID Tenant ID.
  - Scope: Production / Preview / Development
  - Example: `00000000-0000-0000-0000-000000000000`
- `MICROSOFT_CLIENT_ID` (Optional)
  - Purpose: The Application (Client) ID.
  - Scope: Production / Preview / Development
  - Example: `11111111-1111-1111-1111-111111111111`
- `MICROSOFT_CLIENT_SECRET` (Optional)
  - Purpose: The Client Secret for the application.
  - Scope: Production / Preview / Development
  - Example: `your-client-secret-value`
- `MICROSOFT_REDIRECT_URI` (Optional)
  - Purpose: The approved redirect URI configured in Entra ID.
  - Scope: Production / Preview / Development
  - Example: `https://your-production-domain.vercel.app/api/auth/callback/microsoft`

## 4. AI Harness and embeddings
Generation is routed through the server-only provider-neutral AI Harness. Embeddings remain a separate OpenAI integration.

- `OPENAI_API_KEY` (Optional)
  - Purpose: OpenAI key for embeddings only. The generation Harness does not read this value.
  - Scope: Production / Preview / Development
  - Example: `sk-...`
- `EMBEDDING_MODEL` (Optional)
  - Purpose: Embedding model.
  - Scope: Production / Preview / Development
  - Example: `text-embedding-3-small`
- `AI_ENABLED` (Required)
  - Purpose: Emergency kill switch for all AI generation. Keep `false` until a synthetic-data smoke test passes.
  - Example: `false`
- `AI_PROVIDER` / `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`
  - Purpose: Server-only generation provider settings. Defaults are `deepseek`, `https://api.deepseek.com`, and `deepseek-v4-pro`.
  - Scope: set secrets separately for Preview and Production; never use a `NEXT_PUBLIC_` name.
- `AI_TIMEOUT_MS` / `AI_MAX_OUTPUT_TOKENS` (Optional)
  - Purpose: request bounds; defaults are `90000` and `6000`.

The Harness sends `store:false`, JSON Schema output, no tools and no web search. It pseudonymizes known people, case numbers and common identifiers before each request. Production must remain disabled until a real provider key is installed and the Preview smoke test with synthetic data passes.

## 5. App / Runtime Group
Configuration for application runtime behavior.

- `NODE_ENV` (Required)
  - Purpose: Defines the node environment.
  - Scope: Production / Preview / Development
  - Example: `production`
- `VERCEL_URL` (Optional)
  - Purpose: System-provided domain by Vercel for the current deployment.
  - Scope: Production / Preview
  - Example: `your-project-xyz.vercel.app`
- `APP_VERSION` / `COMMIT_SHA` (Optional)
  - Purpose: Identifier for the current application build.
  - Scope: Production / Preview / Development
  - Example: `stable-post-prompt-42c`
