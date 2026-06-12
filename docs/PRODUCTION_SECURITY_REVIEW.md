# Production Security Review

This document outlines the security review, hardening measures, and production readiness checks for the GPC Legal Decision Drafting & Case Management System.

## Security Checklist
- [x] Secrets scanning: Checked for leaked secrets (DATABASE_URL, OPENAI_API_KEY, etc.). No hardcoded secrets found in codebase. Unrelated untracked file (`test.js`) containing secrets logging was removed.
- [x] Environment configuration: `.env.example` contains only placeholder values. Production env categories are defined.
- [x] Dependency Review: Ran `npm audit`. Found vulnerabilities but they require breaking changes to fix (e.g. Next.js 9, Prisma 6.19), so they are skipped to maintain stability. No risky upgrades performed.
- [x] Security Headers: Added security headers to `next.config.ts` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- [x] API Error Handling: Sanitized error messages in `src/app/api/registry/import/route.ts` and `src/app/api/cases/[id]/documents/route.ts` to prevent Prisma stack trace leakage. Safe Thai messages are now used.
- [x] File Storage URL Validation: Enhanced URL validation in `src/lib/documents/documentStorage.ts` to parse URLs and enforce `http`/`https` and strict domain matching for SharePoint/OneDrive.
- [x] Audit Logging: Verified that audit logs use `userId` and not a random admin fallback. Audit logging is in place for sensitive operations.

## Pre-launch / Manual Checks Checklist
Manual checks before go-live:
- [ ] Vercel env variables configured
- [ ] Supabase password rotated if ever exposed
- [ ] OpenAI key stored only in Vercel env
- [ ] Microsoft client secret stored only in Vercel env
- [ ] AUTH_SECRET set
- [ ] AUTH_ALLOW_FIRST_ADMIN_BOOTSTRAP disabled after first admin
- [ ] first admin verified
- [ ] non-admin access tested
- [ ] registry import tested with non-sensitive sample
- [ ] DOCX export tested
- [ ] AI tools tested with source-backed sample
- [ ] audit logs verified
- [ ] private real documents not committed
- [ ] backups/export strategy defined

## Known Limitations
- Dependencies (`xlsx`, `@hono/node-server`, `postcss`, `uuid`) have known vulnerabilities that require major version upgrades of Next.js, Prisma, and NextAuth to fix. These should be planned for a future maintenance window.
- Microsoft Graph integration is partially stubbed and requires full Entra ID configuration to be tested securely.
