# Integrating the existing analysis workbench into GPC

## Latest dashboard brief (2026-10-12)

Owner replaced deadline visuals with pending count, black-number year, responsible legal officer and literal proceedingNote. All received-date years included; complaint/appeal separate. Explicit missing values; no guessing or top-N truncation. Candidate only, not Production. 9 dashboard tests/authenticated synthetic browser checks pass. Supabase Browser still denied after reconnect, Vercel connector discovery still empty; no import or promotion.

## Scope and actual state (2026-10-12)

Production configuration now exists; owner approved existing service-role transfer specifically to this GPC Production. Confirmed key type Secret and Production-only; non-sensitive source key/hash/bucket/URL are Config. No key value is committed or recorded here. Supabase browser access was subsequently denied after auto-review HTTP 429; do not bypass it. Storage bucket/source uploads, actual registry writes, full persistence/file workflow verification and main merge/promotion have NOT occurred. The original production site remains unchanged.

Latest execution: complete private schema/data snapshot is saved and verified (32 tables/198 cases). Both additive migrations were applied through the Supabase connector with matching Prisma-history source checksums; 198 cases remain unchanged. Correct Vercel project confirmed through authenticated Chrome, and its branch Preview is Ready. New dashboard split/import rules pass Prisma validation, typecheck, 6 dashboard tests and 11 analysis safety tests; production compilation passes without a live DB connection. Production Storage configuration, uploads, latest registry import, live workflow QA and deployment are still being completed. Earlier infrastructure blocker notes below are historical.

This is a candidate for the existing website at https://gpc-legal-decision-drafting-case-ma.vercel.app, not a replacement site or new dashboard. The existing login/authentication configuration is preserved. No credentials are recorded here.

Use the existing sidebar entry **วิเคราะห์และร่างคำวินิจฉัย**, or enter from a selected case. Input, evidence review, source approval, deterministic checks, immutable manual drafts, Word export, and deliberately reviewed case attachment are ported. Official case status, owners and legal officer assignments are never updated by the analysis service.

AI proposals now route through the shared server-only Harness, but remain disabled by default. Manual drafting and Word export continue without an AI key. Enable only in Preview after configuring `AI_API_KEY` and passing a synthetic-data smoke test; Production stays disabled until that result is accepted. PDF/DOCX/XLSX/image automatic extraction still needs a bounded server-compatible parser; uploads currently allow 3 MB (not the local app's 20 MB); large direct-to-private-storage upload and local SQLite job migration still need implementation.

## Infrastructure blockers

1. Supabase project `tlqszhlggvoirhalsxge` is now ACTIVE_HEALTHY. Exact SQL confirms 198 cases, 32 public tables and 8 successful Prisma migrations. No other project was changed by this task. Fresh logical data was retrieved, but saving it stopped on approval-review HTTP 429. The ignored `private-test-data/database-backup-20261012/public-data.json.partial` (99,886 bytes) is incomplete, not a usable backup. Complete and verify schema/data backup before any DDL.
2. The Vercel connector can see the original team, but project discovery is empty and the saved project ID cannot be retrieved. Restore access/confirm the correct project before any environment change or deploy.
3. No working private Storage configuration or live migration/persistence QA is verified here.

## Private knowledge preparation

Run locally, outside build:

```powershell
node scripts/analysis/export-knowledge.mjs C:/APP/data/police-appointments-2569 private-test-data/analysis-cloud-export
```

The utility verifies the complete local manifest and SQLite source hash before generating the private JSON/PDF export and upload manifest. This generated output is ignored by Git; never put it in public assets, GitHub, preview fixture data or a public bucket. Original local data is only read and preserved.

Create a **private** `analysis-private` Storage bucket, with no anonymous/client policies; ensure project/bucket identity before uploading each content-addressed object from the manifest. Verify every uploaded hash. Configure server-only:

- `SUPABASE_URL` (or the existing public project URL fallback) and `SUPABASE_SERVICE_ROLE_KEY`
- `ANALYSIS_STORAGE_BUCKET`
- `ANALYSIS_KNOWLEDGE_OBJECT` and `ANALYSIS_KNOWLEDGE_SHA256` (from the verified generated manifest)

Do not expose the service-role key through NEXT_PUBLIC variables. The server checks bucket privacy and rejects hash mismatches. PDF links are time-limited and require application permission to obtain. [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).

## Migration/release sequence

1. Resolve Free quota and restore the same Supabase project to ACTIVE.
2. Obtain a fresh logical backup outside Git, schema, extensions, migration history and table row counts. Stop if backup fails.
3. Compare actual schema against main and Prisma; do not reset or db push. Review the additive AnalysisWorkspace migration. Apply migrations manually only after reconciliation/backup, never during build.
4. Upload verified knowledge only to the confirmed private bucket. Keep Preview isolated from real cases; this candidate has no automatic demo fallback.
5. Run live ownership/role tests (admin, assigned/unassigned legal officer, commissioner, registry officer, viewer, unauthenticated). Confirm foreign workspace IDs, wrong-case attachment, cross-origin mutations and public Storage are denied.
6. Validate real DB-ready/empty/missing-table/disconnected states, optimistic concurrent writes and duplicate attachment. Compare case counts and statuses before/after: unchanged except explicit new document/event records.
7. Test all source approval, source invalidation, manual seniority, vacancies, draft revisions, source links, Word output, upload limits and failure cleanup.
8. Resolve incomplete extraction/large uploads/AI/local-job migration as agreed; verify the Word rendering and legal reviewer acceptance before claiming equivalence.
9. Verify intended Vercel owner/project; deploy Preview, test existing login without changing credentials, then promote only after complete acceptance. No main merge or production deploy was performed in this task.

## Tests actually executed

- Prisma validate and generate: pass.
- Typecheck: pass.
- Analysis safety tests: 11 pass; existing dashboard regression: 5 pass.
- Production build: pass with a deliberately unreachable test-only DATABASE_URL; no runtime DB proof or DB writes.
- Private knowledge export: verified 7 PDFs, 870 indexed records, 2,723,939-byte snapshot. No private records committed or uploaded.
- Browser: local development, desktop 1366x900/mobile 320x720; page renders inside existing AppShell, no page errors, editable input, navigation guard, no mobile horizontal overflow. Real unavailable DB API returns 503, not a fake successful save. Browser skill is absent from the available catalogue, so bundled Playwright with installed headless Chrome was used.

Live database workflow, production authentication/role QA, Word rendering, upload/rollback behaviour against real Storage, and online deployment are **not tested** and remain blockers.
