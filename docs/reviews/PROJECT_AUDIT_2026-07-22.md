# Project Audit — 22 July 2026

Repository: `golfamonthep/GPC-Legal-Decision-Drafting-Case-Management-System`

## Executive assessment

The project has broad functional coverage, but its operational maturity is below its feature maturity. The main risk is not missing functionality; it is that rapid production changes have outpaced automated validation, authentication hardening, and source-of-truth maintenance.

The repository should not be treated as production-safe while `AUTH_MODE=none` is active on an internet-accessible deployment.

## P0 findings addressed in this branch

### 1. Authentication was globally bypassed

Affected files:

- `src/lib/auth/mvp-auth.ts`
- `src/proxy.ts`
- `src/app/login/page.tsx`

The active code hard-coded auth mode to `none`, created an ADMIN user for every request, redirected the login page to the dashboard, and allowed every request through the proxy.

Changes in this branch:

- environment-driven auth mode with fail-closed production behavior;
- `AUTH_MODE=none` blocked in production unless an explicit dangerous override is set;
- controlled `simple` and `microsoft` modes restored;
- missing or invalid auth configuration returns HTTP 503 instead of granting access;
- login page restored.

### 2. Simple-auth cookies were forgeable

The previous cookie value was the literal string `true`. Any client could create that cookie manually.

Changes in this branch:

- HMAC-SHA256 signed session token;
- expiry and nonce embedded in the token;
- constant-time signature comparison;
- HTTP-only, secure production cookie;
- twelve-hour session lifetime.

### 3. Database health diagnostics disclosed infrastructure details

The public health endpoint returned the database host and detailed provider-specific diagnostics.

Changes in this branch:

- generic production response by default;
- detailed output only when `HEALTH_EXPOSE_DETAILS=true`;
- HTTP 503 for unhealthy state;
- explicit no-store caching headers.

### 4. No repository CI gate

There was no GitHub Actions workflow protecting pull requests from lint, TypeScript, or Prisma-schema failures.

Changes in this branch:

- pull-request and main-branch CI workflow;
- dependency installation with `npm ci`;
- Prisma client generation and schema validation;
- ESLint and TypeScript checks;
- concurrent stale runs cancelled.

### 5. No automated dependency monitoring

Dependabot is now configured for npm and GitHub Actions updates.

## P1 findings requiring the next change set

### 1. Prisma schema and deployed migration disagree

`prisma/schema.prisma` still declares:

```prisma
blackNumber String  @unique
redNumber   String? @unique
```

but migration `20260721_case_numbers_unique_per_type` removes those global indexes and creates composite uniqueness by `(type, blackNumber)` and `(type, redNumber)`.

Risk:

- future Prisma migrations can attempt to restore the wrong global uniqueness;
- generated Prisma types advertise incorrect unique selectors;
- developers can write `findUnique({ blackNumber })` even though that assumption is no longer valid.

Required correction:

```prisma
blackNumber String
redNumber   String?

@@unique([type, blackNumber])
@@unique([type, redNumber])
```

This should be corrected before the next schema migration.

### 2. Test coverage is effectively absent

The package has lint and typecheck scripts but no unit, integration, or end-to-end test runner. Critical behaviors needing tests first:

- Thai date parsing and Buddhist-era conversion;
- case-number normalization;
- red-number completion rules;
- registry synchronization and duplicate/conflict behavior;
- role-permission matrix;
- auth-mode fail-closed behavior;
- archive and finalization state transitions.

### 3. Registry import needs resource limits

`src/app/api/registry/import/route.ts` accepts an arbitrary array, accumulates per-row messages, and performs many writes in request time.

Recommended controls:

- maximum row count and payload size;
- maximum returned diagnostic messages;
- import job identifier and resumable/background execution for large files;
- import summary stored in the database;
- explicit idempotency key or source-file hash.

### 4. String-based workflow states are too permissive

Many core fields use free-form `String` values for roles, statuses, workflow states, document types, and results. This allows invalid states and spelling variants to enter the database.

Convert stable domains to Prisma enums incrementally, beginning with:

- `User.role` and `User.status`;
- `Case.type`;
- draft status and section status;
- meeting status;
- archive status;
- ingestion job status.

### 5. Audit logs may retain excessive personal data

Registry import stores the full imported row in `AuditLog.afterValue`. For a legal case-management system, retention, access control, redaction, and export policy for these JSON snapshots must be explicit.

### 6. Documentation is stale and contradictory

`README.md` still contains create-next-app boilerplate and states that the UI uses mock data. `PROJECT_STATE.md` contains old deployment identifiers and simultaneously records both enforced authentication and the later complete bypass.

These files must be treated as operational controls, not historical notes. Keep a short current-state section and move old prompt history to an archive document.

## Recommended delivery order

1. Merge this authentication/CI hardening branch after CI passes and Vercel environment variables are configured.
2. Correct Prisma composite uniqueness in `schema.prisma`; validate migration diff against production.
3. Add tests for auth, case status, dates, and registry synchronization.
4. Add import limits and background-job architecture.
5. Normalize workflow fields into enums.
6. Rewrite the README and consolidate project-state documentation.

## Required production environment before merging

Choose one mode.

### Controlled pilot

```env
AUTH_MODE=simple
MVP_ACCESS_CODE=<strong-random-code>
MVP_SESSION_SECRET=<at-least-32-random-bytes>
MVP_DEFAULT_ROLE=REGISTRY_OFFICER
ALLOW_INSECURE_AUTH_MODE=false
```

### Production Microsoft login

```env
AUTH_MODE=microsoft
NEXTAUTH_SECRET=<at-least-32-random-bytes>
NEXTAUTH_URL=https://<production-domain>
MICROSOFT_ENTRA_ID_TENANT_ID=<tenant-id>
MICROSOFT_ENTRA_ID_CLIENT_ID=<client-id>
MICROSOFT_ENTRA_ID_CLIENT_SECRET=<client-secret>
ALLOW_INSECURE_AUTH_MODE=false
```

Do not merge while production still relies on unauthenticated access unless downtime/lockout has been planned and the replacement credentials are already set.
