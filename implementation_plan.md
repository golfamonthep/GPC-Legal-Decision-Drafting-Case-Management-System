# Records Retention, Archiving, and Knowledge Reuse Implementation Plan

# Implement Records Retention, Archiving, and Knowledge Reuse Workflow

The system now needs a full workflow for safely preserving, archiving, and optionally re‑using knowledge from finalized cases. This includes:
- API endpoints for listing archive‑ready cases, archiving, unarchiving, setting/legal‑hold, and knowledge‑reuse review.
- UI pages for executives and case detail screens to trigger these actions.
- Permission checks using the new granular permissions added to `src/lib/auth/permissions.ts`.
- Audit logging for all actions.
- Minor Prisma migration tweaks (already applied) and a migration run.

## User Review Required

> [!IMPORTANT]
> The following items require your confirmation before any code is committed or migrations are run:
> - **Permission mapping** – ensure the new permissions (`ARCHIVE_CASE`, `UNARCHIVE_CASE`, `SET_LEGAL_HOLD`, `REQUEST_KNOWLEDGE_REUSE`, `APPROVE_KNOWLEDGE_REUSE`, `REJECT_KNOWLEDGE_REUSE`) align with your role matrix.
> - **API route naming** – we propose REST‑style routes under `/api/cases/[id]/archive`, `/api/cases/[id]/legal-hold`, `/api/cases/[id]/knowledge-reuse`. Confirm if these paths suit your routing conventions.
> - **Front‑end integration** – we will add a "Records" page under `/app/records/page.tsx` and embed buttons on the case detail page. Confirm UI placement and any branding requirements.
> - **Migration execution** – the Prisma schema already contains the new models. Confirm you want us to execute `npx prisma migrate deploy` now.

## Open Questions

> [!WARNING]
> - Do you want the **archive** operation to automatically move files to a cloud storage bucket (e.g., Azure Blob) or just record metadata (`digitalArchiveFolderUrl`) for manual handling?
> - Should the **knowledge‑reuse** approval automatically trigger RAG ingestion, or should it remain a manual step (e.g., an admin clicks a button in the UI after approval)?
> - Do you need **email notifications** for archiving or knowledge‑reuse requests? If so, provide the notification service details.

## Proposed Changes

---
### API Layer

#### [MODIFY] [recordsRetentionRoutes](file:///c:/APP/src/app/api/records/route.ts)
- Already created list‑ready endpoint.
- Add `POST /api/records/archive` to archive a case (body: `{ caseId, reason, locationUrl }`).
- Add `POST /api/records/unarchive` similarly.
- Add `POST /api/records/legal-hold` to set/clear legal hold.

#### [NEW] [caseArchiveRoute](file:///c:/APP/src/app/api/cases/[id]/archive/route.ts)
- Handles `POST` for a single case: archive, unarchive, set legal hold.
- Checks permissions via `requirePermission(user, 'ARCHIVE_CASE')` etc.

#### [NEW] [knowledgeReuseRoute](file:///c:/APP/src/app/api/cases/[id]/knowledge-reuse/route.ts)
- `POST /request` → `requestKnowledgeReuse`
- `POST /approve` → `approveKnowledgeReuse`
- `POST /reject` → `rejectKnowledgeReuse`
- Permission checks for `REQUEST_KNOWLEDGE_REUSE`, `APPROVE_KNOWLEDGE_REUSE`, `REJECT_KNOWLEDGE_REUSE`.

---
### UI Layer

#### [NEW] [recordsPage](file:///c:/APP/src/app/records/page.tsx)
- Table of cases ready for archiving.
- Buttons: **Archive**, **Set Legal Hold**, **Request Knowledge Reuse**.
- Uses Tailwind for a premium look (dark mode, gradient headers, micro‑animations).

#### [MODIFY] [caseDetailPage](file:///c:/APP/src/app/cases/[id]/page.tsx)
- Add an **Archive** tab with status badge.
- Show legal‑hold toggle and knowledge‑reuse request button when case status is `CLOSED`/`FINALIZED`.

#### [MODIFY] [executivePage](file:///c:/APP/src/app/executive/page.tsx)
- Add a **Records** navigation entry linking to `/records`.
- Show summary cards: # of archive‑ready cases, # under legal hold, pending knowledge‑reuse reviews.

---
### Permissions (already added)
- Ensure `ROLE_PERMISSIONS` includes the new permissions for each role (Admin, Manager, LegalOfficer, Viewer).

---
### Migration & Build
- Run `npx prisma migrate deploy` (production).
- Run `npx prisma generate`.
- Typecheck `npm run typecheck` (or `npx tsc --noEmit`).
- Build `npm run build`.

## Verification Plan

### Automated Tests
- Unit tests for helper functions in `src/lib/records/*.test.ts`.
- API route integration tests using `next-test-api-route-handler`.
- Permission enforcement tests.

### Manual Verification
- As an admin, navigate to **Records** page, archive a case, verify audit log entry.
- Attempt to archive a case that fails readiness checks – UI should display blockers.
- Request knowledge reuse, approve as manager, ensure status updates.
- Verify that `digitalArchiveFolderUrl` is stored correctly.

---
