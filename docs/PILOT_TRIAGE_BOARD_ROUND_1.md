# Pilot Triage Board - Round 1 (Pre-Pilot)

*Note: Since real Pilot feedback was not yet available, this board tracks unresolved Critical/High issues from Prompt 79/80 and specific structural issues (Data Integrity, Legal Completion Logic) mandated by Prompt 83.*

## Triaged Issues

| Issue ID | Category | Severity | Priority | Status | Owner | Fix Decision | Files Changed | Verification Evidence | Remaining Risk | Next Action |
|----------|----------|----------|----------|--------|-------|--------------|---------------|-----------------------|----------------|-------------|
| PRE-1 | Data Integrity / Import | 1: Critical | P0 | Fixed | Triage Lead | Force red-number cases without closed status to 'เสร็จสิ้น' during import to prevent "มีเลขแดงแต่ยังไม่เสร็จสิ้น" | `src/app/api/registry/import/route.ts` | Tested via `npm run build` and `prisma validate` | None | Verify via UI during Pilot |
| PRE-2 | Dashboard / Reporting | 2: High | P1 | Fixed | Triage Lead | Align Dashboard `notIn` array with strict `caseStatus.ts` variants to exclude all closed cases from overdue calculation | `src/lib/services/dashboard.ts` | Tested via `npm run build` | None | Verify via Dashboard Metrics |
| PRE-3 | Case Management | 2: High | P1 | Fixed | Triage Lead | Align Case Search `preset` and DB-level `in/notIn` queries with strict `caseStatus.ts` variants | `src/lib/search/caseSearch.ts`, `src/app/cases/page.tsx` | Tested via `npm run build` | None | Verify via Case List Filters |
| PRE-4 | Technical Debt | 4: Low | P3 | Deferred | Engineering | Fix 1700+ TypeScript `any` Linter warnings (Deferred to avoid massive refactoring during freeze) | N/A | N/A | Risk of runtime type bugs | Fix post-Pilot |
| PRE-5 | Architecture | 4: Low | P3 | Deferred | Engineering | Microsoft Graph Live Document Sync (Deferred to post-Pilot) | N/A | N/A | Low | Implement post-Pilot |
| PRE-6 | Configuration | 2: High | P2 | Deferred | Product Owner | Vercel Deployment Preview DB config and Azure AD role mapping (Requires manual PO action) | N/A | N/A | Block Pilot Users | PO to configure |
